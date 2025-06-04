import { cn } from "@/lib/utils";

function SelectionCard({
  icon: Icon,
  title,
  isSelected,
  onClick,
  size = "default",
  className,
}: {
  icon?: React.ElementType;
  title: string;
  isSelected: boolean;
  onClick: () => void;
  size?: "default" | "small";
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center rounded-md border-2",
        size === "default" ? "space-x-2 p-3" : "h-7 px-3 py-1",
        isSelected
          ? "border-primary/70 bg-primary/15 dark:bg-primary/20"
          : "border-input hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10",
        isSelected && size === "small" && "bg-primary text-primary-foreground",
        className,
      )}
    >
      {Icon && size === "default" && (
        <div className="bg-primary/20 rounded-full p-2">
          <Icon className="text-primary h-3 w-3" />
        </div>
      )}
      <span className={cn("text-sm font-medium")}>{title}</span>
    </div>
  );
}

export { SelectionCard };
