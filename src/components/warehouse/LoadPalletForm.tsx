import { useState, type FormEvent } from 'react';

import type { LoadPalletPayload } from '../../api/warehouse';

interface LoadPalletFormProps {
  destination: string;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (payload: LoadPalletPayload) => Promise<boolean>;
}

interface FormValues {
  pallet_number: string;
  barcode: string;
  item_name: string;
  quantity: string;
}

const EMPTY_FORM: FormValues = {
  pallet_number: '',
  barcode: '',
  item_name: '',
  quantity: '1',
};

export function LoadPalletForm({
  destination,
  isSubmitting,
  serverError,
  onSubmit,
}: LoadPalletFormProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const palletNumber = values.pallet_number.trim();
    const barcode = values.barcode.trim();
    const itemName = values.item_name.trim();
    const quantityValue = values.quantity.trim();
    const quantity = Number(quantityValue);

    if (!palletNumber || !barcode || !itemName) {
      setValidationError('Enter a pallet number, barcode, and item name.');
      return;
    }

    if (!/^\d+$/.test(quantityValue) || !Number.isSafeInteger(quantity) || quantity < 1) {
      setValidationError('Quantity must be a whole number of at least 1.');
      return;
    }

    setValidationError(null);
    const succeeded = await onSubmit({
      destination,
      pallet_number: palletNumber,
      barcode,
      item_name: itemName,
      quantity,
    });

    if (succeeded) {
      setValues(EMPTY_FORM);
    }
  };

  const errorMessage = validationError ?? serverError;

  return (
    <form className="load-pallet-form" onSubmit={(event) => void handleSubmit(event)}>
      <p className="inspector-section-label">Load pallet</p>
      <div className="form-field">
        <label htmlFor="load-destination">Destination</label>
        <input id="load-destination" name="destination" value={destination} readOnly />
      </div>
      <div className="form-field">
        <label htmlFor="load-pallet-number">Pallet Number</label>
        <input
          autoComplete="off"
          disabled={isSubmitting}
          id="load-pallet-number"
          name="pallet_number"
          maxLength={64}
          onChange={(event) => updateValue('pallet_number', event.target.value)}
          required
          value={values.pallet_number}
        />
      </div>
      <div className="form-field">
        <label htmlFor="load-barcode">Barcode</label>
        <input
          autoComplete="off"
          disabled={isSubmitting}
          id="load-barcode"
          name="barcode"
          maxLength={64}
          onChange={(event) => updateValue('barcode', event.target.value)}
          required
          value={values.barcode}
        />
      </div>
      <div className="form-field">
        <label htmlFor="load-item-name">Item Name</label>
        <input
          disabled={isSubmitting}
          id="load-item-name"
          name="item_name"
          maxLength={128}
          onChange={(event) => updateValue('item_name', event.target.value)}
          required
          value={values.item_name}
        />
      </div>
      <div className="form-field">
        <label htmlFor="load-quantity">Quantity</label>
        <input
          disabled={isSubmitting}
          id="load-quantity"
          inputMode="numeric"
          min="1"
          name="quantity"
          onChange={(event) => updateValue('quantity', event.target.value)}
          required
          step="1"
          type="number"
          value={values.quantity}
        />
      </div>

      {errorMessage && (
        <p className="warehouse-error" role="alert">
          {errorMessage}
        </p>
      )}

      <button className="warehouse-action-button warehouse-action-button--primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Loading pallet…' : 'Load Pallet'}
      </button>
    </form>
  );
}
