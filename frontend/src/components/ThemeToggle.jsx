import { useTheme } from "../context/themeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    >
      {theme === "dark" ? "\u2600\uFE0F Light" : "\uD83C\uDF19 Dark"}
    </button>
  );
}

export default ThemeToggle;
