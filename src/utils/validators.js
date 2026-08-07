const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

export const validateName = (value) => {
  const trimmed = (value || '').trim();

  if (!trimmed) {
    return { isValid: false, message: 'El nombre es obligatorio' };
  }

  if (!NAME_PATTERN.test(trimmed)) {
    return { isValid: false, message: 'El nombre solo debe contener letras y espacios' };
  }

  return { isValid: true, message: '' };
};

export const validateGuestForm = (formData) => {
  const errors = {};

  const nameValidation = validateName(formData.full_name);
  if (!nameValidation.isValid) {
    errors.full_name = nameValidation.message;
  }

  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Ingresa un email válido';
  }

  if (!formData.phone || !/^\+?\d{7,15}$/.test(formData.phone)) {
    errors.phone = 'El teléfono debe contener solo números y al menos 7 dígitos';
  }

  return errors;
};

export const validateUserForm = (formData) => {
  const errors = {};

  const nameValidation = validateName(formData.full_name);
  if (!nameValidation.isValid) {
    errors.full_name = nameValidation.message;
  }

  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Ingresa un email válido';
  }

  if (!formData.password || formData.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return errors;
};
