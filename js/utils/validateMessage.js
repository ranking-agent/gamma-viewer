import Ajv from 'ajv';
import ymlFile from '../kgsSchema.yml';

export default function validateMessage(message) {
  const ajv = new Ajv();
  const validate = ajv.compile(ymlFile);
  return validate(message);
}
