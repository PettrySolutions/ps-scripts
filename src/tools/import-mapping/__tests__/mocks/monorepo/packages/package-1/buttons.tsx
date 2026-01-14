// @test/ui Button component - additional file showing internal imports
import { ButtonProps } from './index';

export const IconButton = ({ icon, ...props }: ButtonProps & { icon: string }) => {
  return <button {...props}>{icon}</button>;
};

export const LinkButton = ({ href, ...props }: ButtonProps & { href: string }) => {
  return <a href={href}><button {...props} /></a>;
};

// Unused component for testing
export const DeprecatedButton = (props: ButtonProps) => {
  console.warn('DeprecatedButton is deprecated');
  return <button {...props} />;
};
