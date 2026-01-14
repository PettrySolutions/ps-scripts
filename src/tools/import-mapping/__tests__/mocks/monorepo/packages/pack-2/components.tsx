// @test/core types - additional file
import { Button, Input } from '@test/ui';
import { formatDate, formatCurrency } from '@test/utils';

// @test/core internal utility that uses other packages
export const FormattedDisplay = ({ date, amount }: { date: Date; amount: number }) => {
  return (
    <div>
      <Button>{formatDate(date)}</Button>
      <Input value={formatCurrency(amount)} readOnly />
    </div>
  );
};
