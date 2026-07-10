"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Named highlight colors so the swatch shown in the menu and the color written
// to the mark can never drift apart.
const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
] as const;

const HEADING_LEVELS = [1, 2, 3, 4] as const;
const HEADING_ICONS = {
  1: Heading1,
  2: Heading2,
  3: Heading3,
  4: Heading4,
} as const;

const TEXT_ALIGNMENTS = [
  { label: "Align left", value: "left", icon: AlignLeft },
  { label: "Align center", value: "center", icon: AlignCenter },
  { label: "Align right", value: "right", icon: AlignRight },
  { label: "Justify", value: "justify", icon: AlignJustify },
] as const;

type IconType = typeof Bold;

/** A single icon button that reflects its command's active/enabled state. */
function ToolbarButton({
  label,
  icon: Icon,
  isActive = false,
  disabled = false,
  onSelect,
}: {
  label: string;
  icon: IconType;
  isActive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      variant={isActive ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onSelect}
    >
      <Icon className="size-4" />
    </Button>
  );
}

function ToolbarDivider() {
  return <Separator orientation="vertical" className="mx-0.5 h-5" />;
}

/** Paragraph / Heading level picker. */
function BlockTypeMenu({ editor }: { editor: Editor }) {
  const activeLevel = HEADING_LEVELS.find((level) =>
    editor.isActive("heading", { level })
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={activeLevel ? "secondary" : "ghost"}
            size="sm"
            aria-label="Text style"
          />
        }
      >
        <Heading className="size-4" />
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow className="size-4" />
          Paragraph
        </DropdownMenuItem>
        {HEADING_LEVELS.map((level) => {
          const Icon = HEADING_ICONS[level];
          return (
            <DropdownMenuItem
              key={level}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level }).run()
              }
            >
              <Icon className="size-4" />
              Heading {level}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Bullet / ordered list picker. */
function ListMenu({ editor }: { editor: Editor }) {
  const isActive =
    editor.isActive("bulletList") || editor.isActive("orderedList");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            aria-label="Lists"
          />
        }
      >
        <List className="size-4" />
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
          Bullet list
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
          Numbered list
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Highlight color swatches plus a remove option. */
function HighlightMenu({ editor }: { editor: Editor }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={editor.isActive("highlight") ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="Highlight"
          />
        }
      >
        <Highlighter className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {HIGHLIGHT_COLORS.map(({ label, value }) => (
          <DropdownMenuItem
            key={value}
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: value }).run()
            }
          >
            <span
              className="size-4 rounded-sm ring-1 ring-foreground/15"
              style={{ backgroundColor: value }}
            />
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => editor.chain().focus().unsetHighlight().run()}
          disabled={!editor.isActive("highlight")}
        >
          <Highlighter className="size-4 opacity-60" />
          Remove highlight
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** URL entry popover for creating/editing a link on the current selection. */
function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const openWithCurrentHref = (next: boolean) => {
    if (next) {
      setUrl((editor.getAttributes("link").href as string) ?? "");
    }
    setOpen(next);
  };

  const applyLink = () => {
    const href = url.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) {
      chain.setLink({ href }).run();
    } else {
      chain.unsetLink().run();
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={openWithCurrentHref}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={editor.isActive("link") ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="Link"
          />
        }
      >
        <LinkIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Link URL
          </label>
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={url}
              placeholder="https://example.com"
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
            />
            <Button type="button" size="sm" onClick={applyLink}>
              Apply
            </Button>
          </div>
          {editor.isActive("link") ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .unsetLink()
                  .run();
                setOpen(false);
              }}
            >
              <Unlink className="size-4" />
              Remove link
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** URL entry popover for embedding an image. */
function ImagePopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");

  const insertImage = () => {
    const url = src.trim();
    if (!url) return;
    editor.chain().focus().setImage({ src: url, alt: alt.trim() }).run();
    setSrc("");
    setAlt("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Insert image"
          />
        }
      >
        <ImageIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Image URL
          </label>
          <Input
            autoFocus
            value={src}
            placeholder="https://example.com/image.png"
            onChange={(event) => setSrc(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                insertImage();
              }
            }}
          />
          <label className="text-xs font-medium text-muted-foreground">
            Alt text (optional)
          </label>
          <Input
            value={alt}
            placeholder="Describe the image"
            onChange={(event) => setAlt(event.target.value)}
          />
          <Button
            type="button"
            size="sm"
            className="self-start"
            onClick={insertImage}
            disabled={!src.trim()}
          >
            Insert image
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return <div className="h-10 rounded-lg border bg-muted/30" />;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-0.5 rounded-lg border p-1">
      <ToolbarButton
        label="Undo"
        icon={Undo2}
        disabled={!editor.can().undo()}
        onSelect={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label="Redo"
        icon={Redo2}
        disabled={!editor.can().redo()}
        onSelect={() => editor.chain().focus().redo().run()}
      />

      <ToolbarDivider />

      <BlockTypeMenu editor={editor} />
      <ListMenu editor={editor} />
      <ToolbarButton
        label="Blockquote"
        icon={Quote}
        isActive={editor.isActive("blockquote")}
        onSelect={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="Code block"
        icon={SquareCode}
        isActive={editor.isActive("codeBlock")}
        onSelect={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        label="Bold"
        icon={Bold}
        isActive={editor.isActive("bold")}
        onSelect={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic"
        icon={Italic}
        isActive={editor.isActive("italic")}
        onSelect={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Underline"
        icon={UnderlineIcon}
        isActive={editor.isActive("underline")}
        onSelect={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="Strikethrough"
        icon={Strikethrough}
        isActive={editor.isActive("strike")}
        onSelect={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        label="Inline code"
        icon={Code}
        isActive={editor.isActive("code")}
        onSelect={() => editor.chain().focus().toggleCode().run()}
      />
      <HighlightMenu editor={editor} />
      <LinkPopover editor={editor} />

      <ToolbarDivider />

      <ToolbarButton
        label="Superscript"
        icon={SuperscriptIcon}
        isActive={editor.isActive("superscript")}
        onSelect={() => editor.chain().focus().toggleSuperscript().run()}
      />
      <ToolbarButton
        label="Subscript"
        icon={SubscriptIcon}
        isActive={editor.isActive("subscript")}
        onSelect={() => editor.chain().focus().toggleSubscript().run()}
      />

      <ToolbarDivider />

      {TEXT_ALIGNMENTS.map(({ label, value, icon }) => (
        <ToolbarButton
          key={value}
          label={label}
          icon={icon}
          isActive={editor.isActive({ textAlign: value })}
          onSelect={() => editor.chain().focus().setTextAlign(value).run()}
        />
      ))}

      <ToolbarDivider />

      <ImagePopover editor={editor} />
    </div>
  );
}
