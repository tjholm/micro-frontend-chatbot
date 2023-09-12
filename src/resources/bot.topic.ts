import { topic } from "@nitric/sdk";

interface BotMessage {
    connectionId: string
}

export default topic<BotMessage>("bot");