// File with aliased imports
import { Button as PrimaryButton, Input as TextInput } from '@test/ui';
import { formatCurrency as formatMoney } from '@test/utils';

export const PaymentPage = () => {
  return (
    <div>
      <TextInput placeholder="Amount" />
      <PrimaryButton>Pay {formatMoney(100)}</PrimaryButton>
    </div>
  );
};
