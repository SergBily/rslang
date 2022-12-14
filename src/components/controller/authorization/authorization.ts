import AuthorizationEnum from '../../../types/authorization/enum';
import { MethodEnum, UrlFolderEnum } from '../../../types/loadServerData/enum';
import createStatistics from '../../utils/createStatistics';
import getUserData from '../../utils/userLogin';
import Loader from '../load';
import CustomStorage from '../storage';
import Api from '../textbook/controller';

class Authorization extends Loader {
  static message: HTMLElement;

  static emailInput: HTMLInputElement;

  static passwordInput: HTMLInputElement;

  static nameInput: HTMLInputElement;

  static isLogin: boolean;

  constructor() {
    super();
    Authorization.message = document.getElementById('login-error');
    Authorization.emailInput = document.getElementById('email') as HTMLInputElement;
    Authorization.nameInput = document.getElementById('name') as HTMLInputElement;
    Authorization.passwordInput = document.getElementById('password') as HTMLInputElement;
    Authorization.isLogin = Boolean(CustomStorage.getStorage('token'));
  }

  static async createNewUser(): Promise<void> {
    this.message.innerText = '';
    this.message.classList.add('loader');
    const result = await super.load(
      {
        method: MethodEnum.post,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `${this.emailInput.value}`,
          name: `${this.nameInput.value}`,
          password: `${this.passwordInput.value}`,
        }),
      },
      [UrlFolderEnum.users],
    ) as Response;
    if (result.ok) {
      this.message.classList.remove('loader');
      await Authorization.logIn();
      this.message.innerText = 'Вы успешно зарегистрированы и вошли в систему';
      this.message.style.color = 'green';
      Api.updateStatistics(getUserData(), createStatistics());
    } else {
      this.message.classList.remove('loader');
      this.message.style.color = 'red';
      if (!(document.getElementById('email') as HTMLInputElement).value.includes('@')) {
        this.message.innerText = 'Введите верный e-mail';
      } else if ((document.getElementById('name') as HTMLInputElement).value.length <= 0) {
        this.message.innerText = 'Введите имя пользователя';
      } else if ((document.getElementById('password') as HTMLInputElement).value.length < 8) {
        this.message.innerText = 'Слишком короткий пароль';
      } else this.message.innerText = 'Такой пользователь не может быть создан';
    }
  }

  static async logIn(): Promise<void> {
    this.message.innerText = '';
    this.message.classList.add('loader');
    const result = await super.load(
      {
        method: MethodEnum.post,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `${this.emailInput.value}`,
          password: `${this.passwordInput.value}`,
        }),
      },
      [UrlFolderEnum.signin],
    ) as Response;

    if (result.ok) {
      const {
        name, userId, token, refreshToken,
      }: Record<string, string> = await result.json();

      CustomStorage.setStorage('name', name);
      CustomStorage.setStorage('userId', userId);
      CustomStorage.setStorage('token', token);
      CustomStorage.setStorage('refreshToken', refreshToken);

      this.message.classList.remove('loader');
      this.message.innerText = 'Вы вошли в систему';
      this.message.style.color = 'green';

      const closeBtnImg = document.getElementById('close-btn-img');
      closeBtnImg.addEventListener('click', () => {
        this.message.innerText = '';
        (document.querySelector('[href="#statistics"]') as HTMLElement).style.display = '';
        setInterval(() => this.refreshToken(), 10800000);
      });
      setTimeout(() => window.location.reload(), 500);
    } else {
      this.message.classList.remove('loader');
      this.message.style.color = 'red';
      this.message.innerText = 'Неверные учетные данные';
    }
  }

  static async refreshToken(): Promise<void> {
    const userId = CustomStorage.getStorage('userId');
    const result = await super.load(
      {
        method: MethodEnum.get,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          authorization: `Bearer ${CustomStorage.getStorage('refreshToken')}`,
        },
      },
      [UrlFolderEnum.users, userId, 'tokens'],
    ) as Response;

    if (result !== undefined) {
      const {
        token, refreshToken,
      }: Record<string, string> = await result.json();

      CustomStorage.setStorage('token', token);
      CustomStorage.setStorage('refreshToken', refreshToken);
    }
  }

  static async getUserById(): Promise<Record<string, string>> {
    const userId = CustomStorage.getStorage('userId');
    const result = await super.load(
      {
        method: MethodEnum.get,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          authorization: `Bearer ${CustomStorage.getStorage('token')}`,
        },
      },
      [UrlFolderEnum.users, userId],
    ) as Response;
    const { name, email, id }: Record<string, string> = await result.json();
    return { name, email, id };
  }

  private logOut(): void {
    localStorage.clear();
    window.location.reload();
  }

  static clear(): void {
    this.emailInput.value = '';
    this.nameInput.value = '';
    this.passwordInput.value = '';
  }

  public listen(): void {
    const authWrapper = document.querySelector('.login-wrapper');
    authWrapper.addEventListener('click', (event) => {
      event.preventDefault();
      const target = event.target as HTMLElement;

      switch (target.id) {
        case AuthorizationEnum.registration:
          Authorization.createNewUser();
          break;
        case AuthorizationEnum.login:
          Authorization.logIn();
          break;
        case AuthorizationEnum.logout:
          this.logOut();
          break;
        case AuthorizationEnum.cancel:
          Authorization.clear();
          break;
        default:
          break;
      }
    });
  }
}

export default Authorization;
