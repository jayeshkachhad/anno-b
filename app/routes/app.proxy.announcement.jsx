import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { backendRequest } from "../lib/backend.server";

export const loader = async ({ request }) => {

    // Verify this is a valid Shopify App Proxy request
    const { session } = await authenticate.public.appProxy(request);

    const response = await backendRequest({

        endpoint: `/api/public/announcement?shop=${session.shop}`,

        method: "GET",

        internal: true

    });

    return json(response.data);

};