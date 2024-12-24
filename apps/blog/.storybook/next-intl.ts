import en from '../messages/en.json';
import es from '../messages/es.json';
import zh from '../messages/zh.json';

const messagesByLocale: Record<string, any> = {en, es, zh};

const nextIntl = {
  defaultLocale: 'en',
  messagesByLocale,
};

export default nextIntl;
