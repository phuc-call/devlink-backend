export interface ForkResponse {
    forkId: number;
    templateId: number;
    title: string;
    isModified: boolean;
}


export interface AskAIRequest {
    question: string;
    contextCode?: string;
}

export interface AskAIResponse {
    answer: string;
    model: string;
    templateId: number;
}
