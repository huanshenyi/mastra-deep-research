# コンポーネントガイド

このドキュメントでは、プロジェクトで使用されるUIコンポーネントとAI専用コンポーネントの詳細を解説します。

## ディレクトリ構成

```
src/app/components/
├── ui/                    # 汎用UIコンポーネント
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── avatar.tsx
│   └── collapsible.tsx
└── ai-elements/           # AI/ワークフロー専用コンポーネント
    ├── message.tsx
    ├── response.tsx
    ├── tool.tsx
    ├── loader.tsx
    └── code-block.tsx
```

---

## 汎用UIコンポーネント

### Button

アクションを実行するためのボタンコンポーネント。

**ファイル:** `src/app/components/ui/button.tsx`

#### Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| `variant` | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"default"` | ボタンのスタイルバリアント |
| `size` | `"default" \| "sm" \| "lg" \| "icon" \| "icon-sm" \| "icon-lg"` | `"default"` | ボタンのサイズ |
| `asChild` | `boolean` | `false` | 子要素をボタンとして使用するか |

#### 使用例

```tsx
import { Button } from "@/components/ui/button";

// 基本的な使用
<Button>クリック</Button>

// バリアント
<Button variant="destructive">削除</Button>
<Button variant="outline">キャンセル</Button>
<Button variant="secondary">セカンダリ</Button>
<Button variant="ghost">ゴースト</Button>
<Button variant="link">リンク</Button>

// サイズ
<Button size="sm">小さいボタン</Button>
<Button size="lg">大きいボタン</Button>
<Button size="icon"><IconComponent /></Button>

// アイコン付き
<Button>
  <CheckIcon />
  保存
</Button>

// asChild: リンクとして使用
<Button asChild>
  <a href="/settings">設定へ</a>
</Button>

// 無効状態
<Button disabled>無効</Button>
```

---

### Card

コンテンツをグループ化するカードコンポーネント。

**ファイル:** `src/app/components/ui/card.tsx`

#### サブコンポーネント

| コンポーネント | 説明 |
|--------------|------|
| `Card` | カードのルートコンテナ |
| `CardHeader` | カードのヘッダー部分 |
| `CardTitle` | カードのタイトル |
| `CardDescription` | カードの説明文 |
| `CardAction` | ヘッダー右側のアクションエリア |
| `CardContent` | カードのメインコンテンツ |
| `CardFooter` | カードのフッター部分 |

#### 使用例

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>リサーチワークフロー</CardTitle>
    <CardDescription>トピックを入力してリサーチを開始</CardDescription>
    <CardAction>
      <Button size="sm">リセット</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p>カードのコンテンツ</p>
  </CardContent>
  <CardFooter>
    <Button>実行</Button>
  </CardFooter>
</Card>
```

---

### Badge

ステータスやラベルを表示するバッジコンポーネント。

**ファイル:** `src/app/components/ui/badge.tsx`

#### Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| `variant` | `"default" \| "secondary" \| "destructive" \| "outline"` | `"default"` | バッジのスタイルバリアント |
| `asChild` | `boolean` | `false` | 子要素をバッジとして使用するか |

#### 使用例

```tsx
import { Badge } from "@/components/ui/badge";

// バリアント
<Badge>デフォルト</Badge>
<Badge variant="secondary">セカンダリ</Badge>
<Badge variant="destructive">エラー</Badge>
<Badge variant="outline">アウトライン</Badge>

// アイコン付き
<Badge>
  <CheckCircleIcon className="size-3" />
  完了
</Badge>
```

---

### Input

テキスト入力フィールド。

**ファイル:** `src/app/components/ui/input.tsx`

#### 使用例

```tsx
import { Input } from "@/components/ui/input";

<Input placeholder="検索..." />
<Input type="email" placeholder="メールアドレス" />
<Input disabled placeholder="無効" />
```

---

### Textarea

複数行のテキスト入力フィールド。

**ファイル:** `src/app/components/ui/textarea.tsx`

#### 使用例

```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="メッセージを入力..." />
<Textarea rows={5} placeholder="詳細を入力..." />
```

---

### Avatar

ユーザーアバター画像を表示するコンポーネント。

**ファイル:** `src/app/components/ui/avatar.tsx`

#### サブコンポーネント

| コンポーネント | 説明 |
|--------------|------|
| `Avatar` | アバターのルートコンテナ |
| `AvatarImage` | アバター画像 |
| `AvatarFallback` | 画像がない場合のフォールバック |

#### 使用例

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/user.jpg" alt="ユーザー" />
  <AvatarFallback>UN</AvatarFallback>
</Avatar>
```

---

### Collapsible

折りたたみ可能なセクション。

**ファイル:** `src/app/components/ui/collapsible.tsx`

#### サブコンポーネント

| コンポーネント | 説明 |
|--------------|------|
| `Collapsible` | 折りたたみのルートコンテナ |
| `CollapsibleTrigger` | トグルボタン |
| `CollapsibleContent` | 折りたたまれるコンテンツ |

#### 使用例

```tsx
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

<Collapsible>
  <CollapsibleTrigger>詳細を表示</CollapsibleTrigger>
  <CollapsibleContent>
    <p>折りたたまれたコンテンツ</p>
  </CollapsibleContent>
</Collapsible>
```

---

## AI専用コンポーネント

### Loader

ローディングスピナーを表示するコンポーネント。

**ファイル:** `src/app/components/ai-elements/loader.tsx`

#### Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| `size` | `number` | `16` | スピナーのサイズ（px） |

#### 使用例

```tsx
import { Loader } from "@/components/ai-elements/loader";

// 基本的な使用
<Loader />

// サイズ指定
<Loader size={24} />

// テキストと一緒に
<div className="flex items-center gap-2">
  <Loader size={16} />
  <span>処理中...</span>
</div>
```

---

### Message

チャットメッセージを表示するコンポーネント。

**ファイル:** `src/app/components/ai-elements/message.tsx`

#### サブコンポーネント

| コンポーネント | 説明 |
|--------------|------|
| `Message` | メッセージのルートコンテナ |
| `MessageContent` | メッセージ本文 |
| `MessageAvatar` | 送信者アバター |

#### Props

**Message:**

| Prop | 型 | 説明 |
|------|-----|------|
| `from` | `"user" \| "assistant"` | メッセージの送信者 |

**MessageContent:**

| Prop | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| `variant` | `"contained" \| "flat"` | `"contained"` | スタイルバリアント |

**MessageAvatar:**

| Prop | 型 | 説明 |
|------|-----|------|
| `src` | `string` | アバター画像URL |
| `name` | `string` | フォールバック用の名前（2文字に切り詰め） |

#### 使用例

```tsx
import { Message, MessageContent, MessageAvatar } from "@/components/ai-elements/message";

// ユーザーメッセージ
<Message from="user">
  <MessageContent>こんにちは！</MessageContent>
  <MessageAvatar src="/user.jpg" name="User" />
</Message>

// アシスタントメッセージ
<Message from="assistant">
  <MessageContent variant="flat">
    お手伝いします。
  </MessageContent>
  <MessageAvatar src="/assistant.jpg" name="AI" />
</Message>
```

---

### Tool

ワークフローのツール/ステップ実行状態を表示するコンポーネント。

**ファイル:** `src/app/components/ai-elements/tool.tsx`

#### サブコンポーネント

| コンポーネント | 説明 |
|--------------|------|
| `Tool` | ツールのルートコンテナ（Collapsibleベース） |
| `ToolHeader` | ツール名とステータスバッジ |
| `ToolContent` | 折りたたまれるコンテンツエリア |
| `ToolInput` | ツールへの入力パラメータ表示 |
| `ToolOutput` | ツールの出力結果表示 |

#### Props

**ToolHeader:**

| Prop | 型 | 説明 |
|------|-----|------|
| `title` | `string` | ツールのタイトル（省略時は type から生成） |
| `type` | `ToolUIPart["type"]` | ツールのタイプ |
| `state` | `ToolUIPart["state"]` | ツールの状態 |

**state の値:**

| 状態 | バッジ | 説明 |
|-----|-------|------|
| `"input-streaming"` | Pending | 入力ストリーミング中 |
| `"input-available"` | Running | 実行中 |
| `"output-available"` | Completed | 完了 |
| `"output-error"` | Error | エラー |

**ToolInput:**

| Prop | 型 | 説明 |
|------|-----|------|
| `input` | `ToolUIPart["input"]` | 入力パラメータ |

**ToolOutput:**

| Prop | 型 | 説明 |
|------|-----|------|
| `output` | `ToolUIPart["output"]` | 出力結果 |
| `errorText` | `string` | エラーメッセージ（オプション） |

#### 使用例

```tsx
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

<Tool>
  <ToolHeader
    title="Web検索"
    type="tool-web-search"
    state="output-available"
  />
  <ToolContent>
    <ToolInput input={{ query: "React hooks" }} />
    <ToolOutput output={{ results: [...] }} />
  </ToolContent>
</Tool>

// エラー状態
<Tool>
  <ToolHeader
    title="API呼び出し"
    type="tool-api-call"
    state="output-error"
  />
  <ToolContent>
    <ToolInput input={{ endpoint: "/api/data" }} />
    <ToolOutput
      output={null}
      errorText="タイムアウトエラー"
    />
  </ToolContent>
</Tool>
```

---

### CodeBlock

コードブロックを表示するコンポーネント。

**ファイル:** `src/app/components/ai-elements/code-block.tsx`

#### 使用例

```tsx
import { CodeBlock } from "@/components/ai-elements/code-block";

<CodeBlock
  code={`const greeting = "Hello, World!";
console.log(greeting);`}
  language="javascript"
/>

<CodeBlock
  code={JSON.stringify({ key: "value" }, null, 2)}
  language="json"
/>
```

---

### Response

AI応答のテキストをマークダウン形式で表示するコンポーネント。

**ファイル:** `src/app/components/ai-elements/response.tsx`

#### 使用例

```tsx
import { Response } from "@/components/ai-elements/response";

<Response>
  <p>これはAIからの応答テキストです。</p>
  <ul>
    <li>箇条書き1</li>
    <li>箇条書き2</li>
  </ul>
</Response>
```

---

## スタイリングパターン

### cn 関数の使用

`cn` 関数は `clsx` と `tailwind-merge` を組み合わせて、Tailwindクラスを安全にマージします。

```tsx
import { cn } from "@/lib/utils";

// 条件付きクラス
<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)} />

// カスタムクラスの追加
<Button className={cn(buttonVariants({ variant }), "custom-class")} />
```

### CVA バリアントの定義

新しいコンポーネントを作成する場合のパターン:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const myComponentVariants = cva(
  // ベーススタイル
  "inline-flex items-center rounded-md",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
      },
      size: {
        sm: "px-2 py-1 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type MyComponentProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof myComponentVariants>;

function MyComponent({ className, variant, size, ...props }: MyComponentProps) {
  return (
    <div
      className={cn(myComponentVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

---

## 次のステップ

- [Mastra連携ガイド](./mastra-integration.md) - ワークフローとの連携方法
- [フロントエンドアーキテクチャ](./frontend-architecture.md) - プロジェクト構成の詳細
