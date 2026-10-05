export interface Expense {
    id: string;
    branch: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
    vendor: string;
    invoiceNumber: string;
    notes: string;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
}

export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    data: string; // base64
}

export interface Branch {
    id: string;
    name: string;
    address: string;
    phone: string;
}

export interface Settings {
    companyName: string;
    ownerName: string;
    currency: string;
    branches: Branch[];
    categories: string[];
    paymentMethods: string[];
}