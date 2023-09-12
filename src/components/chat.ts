import { LitElement, html, css } from 'lit';
import { when } from 'lit/directives/when.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { customElement } from 'lit/decorators.js';
import Message from '../types/message';

const chatEndpoint = '$$ADDRESS_PLACEHOLDER$$';

const chatIcon = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="w-6 h-6"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
    />
  </svg>
`;

const sendIcon = html`
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
</svg>
`

/**
 * ChatElement
 */
@customElement('chat-element')
export class ChatElement extends LitElement {
    static override styles = css`
    :host {
      position: fixed;
      bottom: 0;
      right: 0;
    }

    .container {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-container {
      border-radius: 10px;
      box-shadow:
        0 20px 25px -5px rgb(0 0 0 / 0.1),
        0 8px 10px -6px rgb(0 0 0 / 0.1);
      padding: 10px;
      border: 1px solid #bdc3c7;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .messages-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 600px;
      max-width: 400px;
      overflow: none;
      overflow-y: auto;
    }

    .message {
      padding: 8px;
      border-radius: 12px;
    }

    .message-self {
      background: #bdc3c7;
      color: black;
      align-self: end;
    }

    .message-other {
      background: #2980b9;
      color: white;
      align-self: start;
    }

    .chat-controls {
      display: flex;
      gap: 4px;
    }

    input[type=text] {
        width: 100%;
        display: inline-block;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
    }
    
    .chat-controls > input {
      flex: 1;
    }

    .chat-controls > button {
      width: 36px;
      height: 36px;
      border: none;
      color: white;
      background-color: #2980b9;
      border-radius: 4px;
    }

    .toggle {
      box-shadow:
        0 20px 25px -5px rgb(0 0 0 / 0.1),
        0 8px 10px -6px rgb(0 0 0 / 0.1);
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 40px;
      padding: 10px;
      border: none;
      color: white;
      background-color: #1abc9c;
      align-self: flex-end;
    }

    .toggle:hover {
      background-color: #16a085;
    }
  `;

    private show = false;
    private ws: WebSocket = null;

    inputRef?: Ref<HTMLInputElement> = createRef();

    private messages: Message[] = [];

    override render() {
        return html`
      <div class="container">
        <!-- chat container -->
        ${when(this.show, this._renderChat, () => html``)}
        <!-- button render component -->
        <button class="toggle" @click=${this._toggleShow}>${chatIcon}</button>
      </div>
    `;
    }

    _onMessage = (evt: MessageEvent<any>) => {
        const message = JSON.parse(evt.data) as Message;

        // We'll consider the chat ready if we've recieved one message from a support person
        this.messages.push(message);

        this.requestUpdate();
    };

    _startChat = async () => {
        if (!this.ws) {
            // connect the the websocket at the chats address
            this.ws = new WebSocket(chatEndpoint);

            // register ws listeners
            this.ws.onmessage = this._onMessage;
        }
    };

    _sendMessage = () => {
        const message = this.inputRef.value.value;

        if (message && message !== "") {
            this.ws.send(message);
        }

        // reset the inputs value
        this.inputRef.value.value = '';
        this.requestUpdate();
    };

    _renderChat = () => {
        // start chat (this will conditionally start calls if a websocket hasn't already been connected)
        this._startChat();
        return html`
      <div class="chat-container">
        <div class="messages-container">
            ${this.messages.map((message) => {
                const classes = {
                    "message": true,
                    // TODO: just make these keys dynamic
                    "message-self": message.from === 'user',
                    "message-other": message.from === 'assistant',
                };

                return html`<div class=${classMap(classes)}>
                    ${message.message}
                </div>`
            })}
        </div>
        <div class="chat-controls">
            <input ${ref(this.inputRef)} type="text"/>
            <button @click=${this._sendMessage}>${sendIcon}</button>
        </div>
      </div>
    `;
    };

    _toggleShow = () => {
        this.show = !this.show;
        this.requestUpdate();
    };
}
