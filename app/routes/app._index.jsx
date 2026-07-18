import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { syncSession, backendRequest } from "../lib/backend.server";


export const loader = async ({ request }) => {
  // await authenticate.admin(request);
  // const { admin } = await authenticate.admin(request);
  const { admin, session } = await authenticate.admin(request);

    const response = await admin.graphql(`
    query shopInfo {
      shop {
        id
        name
        url
        myshopifyDomain
        plan {
          publicDisplayName
          partnerDevelopment
          shopifyPlus
        }
      }
    }
  `);


  
  let dataGet = await response.json();
   console.log("Shop Loaded >>>> ", JSON.stringify(dataGet.data, null, 2))
  
  const {
    data: { shop, id },
  } = dataGet

  console.log("Connecting Real Backend ...")
  
  const backend = await syncSession(
      shop,
      session
  );

  console.log(backend);

  session.backendJwt = backend.token;
  console.log("Backend JWT Session Token stored in App Session........ ")
  
  // console.log(session.backendJwt)



const getBar = await backendRequest({

    endpoint: "/api/announcement/me",

    method: "GET",

    jwt: session.backendJwt

});

console.log("--------------------------- GET -----------------------------------")
console.log(getBar);
console.log("--------------------------- GOT -----------------------------------")


  return { shop, id, announcement: getBar.data };

};

export const action = async ({ request }) => {
  // const { admin } = await authenticate.admin(request);

  const { admin, session } = await authenticate.admin(request);


  const formData = await request.formData();
  const intent = formData.get("intent");


  let bar = {
    text : formData.get("text"),
    bgColor : formData.get("bgColor"),
    textColor : formData.get("textColor")
  }

if (intent === "save") {
    const response = await admin.graphql(`
      query shopInfo {
        shop {
          id
          name
          url
          myshopifyDomain
          plan {
            publicDisplayName
            partnerDevelopment
            shopifyPlus
          }
        }
      }
    `);

    const data = await response.json();

    const shop = data.data.shop;



    const shopName = shop.name;
    const shopId = shop.id;

    console.log("Shop:", shopName);
    console.log("Shop ID:", shopId);
    console.log("Announcement text:", bar.text);
    console.log("Background color:", bar.bgColor);
    console.log("Text color:", bar.textColor);

     console.log("Connecting Real Backend ACTION ...")
  
  const backend = await syncSession(
      shop,
      session
  );

  console.log(backend);

  session.backendJwt = backend.token;
  console.log("Backend JWT Session Token stored in App Session ACTION ........ ")
  

const backendBar = await backendRequest({

    endpoint: "/api/announcement/save",

    method: "POST",

    jwt: session.backendJwt,

    body: {

        announcementText: bar.text,

        backgroundColor: bar.bgColor,

        textColor: bar.textColor,

        enabled: true

    }

});

console.log("--------------------------- SAVE -----------------------------------")
console.log(backendBar);
console.log("--------------------------- SAVED -----------------------------------")

    return { saved: true };

  }

  return {
    barData: bar,
  };

};

let barSet = false;

export default function Index() {

  const { shop, announcement } = useLoaderData();

  console.log("Got Announcement from Loader >>>>>>>>>> ", announcement)
  console.log(announcement.announcementText);
  console.log(announcement.backgroundColor);
  console.log(announcement.textColor);

  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const textAreaRef = useRef(null);
  const bgColorPickerRef = useRef(null);
  const textColorPickerRef = useRef(null);

  const [announcementText, setAnnouncementText] = useState(announcement?.announcementText ?? "Sample Text...");
  const [bgColor, setBgColor] = useState( announcement?.backgroundColor ?? "#FF0000FF");
  const [textColor, setTextColor] = useState( announcement?.textColor ?? "#FFFFFFFF");
  


  // const [announcementText, setAnnouncementText] = useState("");
  // const [bgColor, setBgColor] = useState("#FF0000FF");
  // const [textColor, setTextColor] = useState("#FFFFFFFF");

const initialized = useRef(false);

useEffect(() => {
  if (!announcement || initialized.current) return;

  setAnnouncementText(announcement.announcementText ?? "");
  setBgColor(announcement.backgroundColor ?? "#FF0000FF");
  setTextColor(announcement.textColor ?? "#FFFFFFFF");

  initialized.current = true;
}, [announcement]);

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
  
  // useEffect(() => {
  //   if (!announcement) return;

  //   setAnnouncementText(announcement.announcementText ?? "");
  //   setBgColor(announcement.backgroundColor ?? "#FF0000FF");
  //   setTextColor(announcement.textColor ?? "#FFFFFFFF");
  // }, [announcement]);

  useEffect(() => {

    const textEl = textAreaRef.current;
    const bgEl = bgColorPickerRef.current;
    const textColorEl = textColorPickerRef.current;

    const handleTextChange = (e) => setAnnouncementText(e.target.value);
    const handleBgChange = (e) => setBgColor(e.target.value);
    const handleTextColorChange = (e) => setTextColor(e.target.value);

    textEl?.addEventListener("input", handleTextChange);
    textEl?.addEventListener("change", handleTextChange);
    bgEl?.addEventListener("input", handleBgChange);
    bgEl?.addEventListener("change", handleBgChange);
    textColorEl?.addEventListener("input", handleTextColorChange);
    textColorEl?.addEventListener("change", handleTextColorChange);

    return () => {
      textEl?.removeEventListener("input", handleTextChange);
      textEl?.removeEventListener("change", handleTextChange);
      bgEl?.removeEventListener("input", handleBgChange);
      bgEl?.removeEventListener("change", handleBgChange);
      textColorEl?.removeEventListener("input", handleTextColorChange);
      textColorEl?.removeEventListener("change", handleTextColorChange);
    };
  }, []);

  

  const handleSave = () => {
    fetcher.submit(
      {
        intent: "save",
        text: announcementText,
        bgColor,
        textColor,
      },
      { method: "POST" },
    );
  };

  return (
    <s-page heading="Customise AnnouncementBar">
      <s-section heading={`Welcome Back! ${shop.name}`}>
        <s-divider></s-divider>

        <s-stack gap="base">
          <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base">
            <s-grid-item gridColumn="span 12" gridRow="span 1">
              <s-text-area
                ref={textAreaRef}
                value={announcementText}
                label="Announcement Data"
                placeholder="Enter a announcement..."
                autocomplete="off"
              ></s-text-area>
            </s-grid-item>

            
            <s-s-grid-item gridColumn="span 4" gridRow="span 2">
              <s-box padding="large" border="base" borderRadius="base">
                <s-color-picker
                  ref={bgColorPickerRef}
                  value={bgColor}
                  alpha
                  name="color-with-alpha"
                  label="Background color"
                ></s-color-picker>
              </s-box>
            </s-s-grid-item>

            <s-s-grid-item gridColumn="span 4" gridRow="span 2">
              <s-box padding="large" border="base" borderRadius="base">
                <s-color-picker
                  ref={textColorPickerRef}
                  value={textColor}
                  alpha
                  name="text-color-with-alpha"
                  label="Text color"
                ></s-color-picker>
              </s-box>
            </s-s-grid-item>

          </s-grid>

          <s-box padding="none" borderRadius="base">
            <div
              style={{
                backgroundColor: bgColor,
                color: textColor,
                padding: "16px",
                textAlign: "center",
                borderRadius: "8px",
                fontWeight: 600,
                minHeight: "24px",
              }}
            >
              {announcementText || "Your announcement bar preview will appear here"}
            </div>
          </s-box>

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