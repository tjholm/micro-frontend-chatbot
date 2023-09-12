import type { ChatCompletionRequestMessageRoleEnum } from "openai";

export default interface Message {
  from: ChatCompletionRequestMessageRoleEnum;
  message: string;
}
