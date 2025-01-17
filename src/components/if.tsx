export interface IfProps {
    condition: boolean;
    children: React.ReactNode;
  }
  export function If({ condition, children }: IfProps) {
    return condition ? <>{children}</> : null;
  }
  