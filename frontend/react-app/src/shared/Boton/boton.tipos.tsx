export interface PropiedadesBoton {
    size?: "small" | "medium" | "large";
    disabled?: boolean;
    color: string;
    label: string;
    content?: string;
    icon?: React.ReactNode; 
    onClick?: () => void;
}