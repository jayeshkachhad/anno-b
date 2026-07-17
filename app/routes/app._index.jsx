import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const text = formData.get("text");
    const color = formData.get("color");
    console.log("Announcement text:", text);
    console.log("Color:", color);
    return { saved: true };
  }

  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
            demoInfo: metafield(namespace: "$app", key: "demo_info") {
              jsonValue
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
          metafields: [
            {
              namespace: "$app",
              key: "demo_info",
              value: "Created by React Router Template",
            },
          ],
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;

  return {
    product: responseJson.data.productCreate.product
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const textAreaRef = useRef(null);
  const colorPickerRef = useRef(null);

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
    if (fetcher.data?.saved) {
      shopify.toast.show("Saved");
    }
  }, [fetcher.data, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const handleSave = () => {
    const text = textAreaRef.current?.value ?? "";
    const color = colorPickerRef.current?.value ?? "";
    fetcher.submit(
      { intent: "save", text, color },
      { method: "POST" },
    );
  };

  return (
    <s-page heading="Customise AnnouncementBar">
      <s-section heading="Welcome Back! ">
        <s-divider></s-divider>

        <s-stack gap="base">
          <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base">
            <s-grid-item gridColumn="span 12" gridRow="span 1">
              <s-text-area
                ref={textAreaRef}
                label="Announcement Data"
                placeholder="Enter a detailed description..."
                autocomplete="off"
              ></s-text-area>
            </s-grid-item>

            
            <s-s-grid-item gridColumn="span 4" gridRow="span 2">
              <s-box padding="large" border="base" borderRadius="base">
                <s-color-picker
                  ref={colorPickerRef}
                  value="#FF0000FF"
                  alpha
                  name="color-with-alpha"
                ></s-color-picker>
              </s-box>
            </s-s-grid-item>
           


          </s-grid>
        </s-stack>
      </s-section>
      
            <s-button onClick={handleSave}>
              Save
            </s-button>

            
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};