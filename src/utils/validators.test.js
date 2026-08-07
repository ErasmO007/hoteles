import test from 'node:test';
import assert from 'node:assert/strict';
import { validateName, validateGuestForm, validateUserForm } from './validators.js';

test('validateName rejects names with numbers', () => {
  const result = validateName('Juan123');
  assert.equal(result.isValid, false);
  assert.match(result.message, /solo letras/i);
});

test('validateName accepts names with letters and accents', () => {
  const result = validateName('José María');
  assert.equal(result.isValid, true);
  assert.equal(result.message, '');
});

test('validateGuestForm blocks invalid full name', () => {
  const errors = validateGuestForm({
    full_name: 'Carlos 99',
    email: 'carlos@test.com',
    phone: '5551234',
  });

  assert.match(errors.full_name, /solo letras/i);
});

test('validateUserForm requires a valid full name', () => {
  const errors = validateUserForm({
    full_name: 'Ana123',
    email: 'ana@test.com',
    password: '123456',
  });

  assert.match(errors.full_name, /solo letras/i);
});
