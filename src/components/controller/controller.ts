import { MethodEnum, UrlFolderEnum } from '../../types/loadServerData/enum';
import Loader from './load';

class Controller extends Loader {
  public testquery(id: string): Promise<void | Response> {
    // const user = {
    //   email: 'string',
    //   password: 'string',
    // };

    return Loader.load(
      {
        method: MethodEnum.get,
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify(user),
      }, /* объект с method, headers, body */
      [UrlFolderEnum.words, id], /* параметры (массив) */

      // ['page=1', 'group=0'], /* параметры для words (массив) */
    );
  }
}

export default Controller;
