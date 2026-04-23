import type { TranslationKeys } from './en';

const ru: Record<TranslationKeys, string> = {
  // Navbar
  searchPlaceholder: 'Поиск авторов, тегов, настроений...',
  notifications: 'Уведомления',
  upload: 'Загрузить',
  logIn: 'Войти',
  logout: 'Выйти',

  // Sidebar
  navForYou: 'Для вас',
  navTrending: 'В тренде',
  navFollowing: 'Подписки',
  navRandom: 'Случайное',
  navMyLikes: 'Мои лайки',
  navHistory: 'История',
  explore: 'Обзор',

  // AuthPromptDialog
  pleaseSignIn: 'Войдите в аккаунт',
  authPromptBody: 'Для этого действия нужно войти в аккаунт. Создайте аккаунт или войдите, чтобы продолжить.',
  cancel: 'Отмена',
  signIn: 'Войти',
  register: 'Зарегистрироваться',

  // VideoFeed / VideoList
  noVideosYet: 'Видео пока нет',
  uploadFirstVideo: 'Загрузить первое видео',
  videoNotFound: 'Видео не найдено',
  loadMore: 'Загрузить ещё',

  // UploadDialog
  uploadVideo: 'Загрузка видео',
  uploadSuccess: 'Видео успешно загружено!',
  clickToSelect: 'Нажмите, чтобы выбрать файл',
  fileTypes: 'MP4, WebM, MOV, AVI',
  videoTitle: 'Название',
  videoTitlePlaceholder: 'Введите название видео...',
  uploadError: 'Ошибка загрузки',
  serverError: 'Ошибка соединения с сервером',

  // Settings popover
  settingsTitle: 'Настройки',
  languageLabel: 'Язык',
  darkModeLabel: 'Тёмная тема',

  // VideoAuthPage
  loginTab: 'Войти',
  registerTab: 'Регистрация',
  username: 'Имя пользователя',
  password: 'Пароль',
  loginButton: 'Войти',
  registerButton: 'Зарегистрироваться',
  loginError: 'Ошибка входа',
  registerError: 'Ошибка регистрации',
  connectionError: 'Ошибка соединения с сервером',
};

export default ru;
