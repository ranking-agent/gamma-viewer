import Ajv from 'ajv';
import ymlFile from '../kgsSchema.yml';

export default function validateMessage(message) {
  const ajv = new Ajv({ allErrors: true });
  const valid = ajv.validate(ymlFile, message);
  return {
    valid,
    errors: ajv.errors,
  };
}
