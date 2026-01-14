// @test/ui exports

export const Button = () => {};
export const Input = () => {};
export const Table = () => {};
export const TableRow = () => {};
export const TableCell = () => {};

// Additional exports used by repos
export const Card = () => {};
export const Modal = () => {};
export const Drawer = () => {};
export const Select = () => {};
export const Checkbox = () => {};

export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export type InputType = 'text' | 'password' | 'email';

export default function UIProvider() {}
