import { collection } from '@nitric/sdk';
import Message from '../types/message';

export type ChatStatus = 'unassigned' | 'assigned' | 'solved';
export interface Connection {
  // the id of the chat this user is connected to
  // This saves querying the db by allowing direct key access
  history: Message[];
}


export default collection<Connection>('db');
