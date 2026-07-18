export async function backendRequest({
    endpoint,
    method = "GET",
    jwt,
    body
}) {

    const response = await fetch(
        `${process.env.BACKEND_URL}${endpoint}`,
        {
            method,

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwt}`
            },

            body: body
                ? JSON.stringify(body)
                : undefined
        }
    );

    return response.json();
}


export async function syncSession(shop, session) {


    const response = await fetch(
        `${process.env.BACKEND_URL}/api/session/sync`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",

                "x-api-key": process.env.INTERNAL_API_KEY
            },

            body: JSON.stringify({

                shopId: shop.id,

                shopDomain: shop.myshopifyDomain,

                shopName: shop.name,

                accessToken: session.accessToken,

                scopes: session.scope
                    ? session.scope.split(",")
                    : []

            })
        }
    );

    return response.json();

}


