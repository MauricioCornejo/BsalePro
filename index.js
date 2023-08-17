const product = {
    id: "string", // uuid
    sku: "string",
    name: "string",
    price: "number",
    stock: "",
}

const client = {
    id: "string", // uuid
    rut: "string",
    name: "string",
    lastName: "string",
    email: "string",
    cellPhone: "string",
    address: {
        city: "string",
        commune: "string",
        street: "string",
        streetNumber: "string",
        region: "string",

    },
    type: "string", // Person or other
    isForeign: "boolean",
}

const sale = {
    id: "string", // uuid
    ticketNumber: "number", // autoIncrement 
    products: [{
        id: "string", // uuid
        sku: "string",
        name: "string",
        price: "number",
        stock: "",

    }],
    timesTamp: "string", // Format (DD/MM/YYYY)
    hour: "string",
    client: {
        id: "string", // uuid
        rut: "string",
        name: "string",
    },
    paymentMetod: "string", // Efectivo - Transferencia - Red Compra ... etc
    amountPaid: "number",
    totalAmount: "number",
    status: "string", // Complete - Pending Amount ,
    sellerName: "string", // optional 
}

const purchases = {
    totalAmount: "number",
    provider: "string",
    products: [{
        id: "string", // uuid
        sku: "string",
        name: "string",
        price: "number",
        stock: "",
    }],
    timesTamp: "string", // Format (DD/MM/YYYY)
}


