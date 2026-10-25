// お問い合わせの受け付け（サーバー側でだけ使う。仕様: docs/contact.md）
// 入力のチェック → Turnstile（自動送信よけ）の確認 → microCMS の contacts API に下書きで保存
// キーは Worker の実行時の変数から読む（ブラウザには出さない）。未設定でもページが落ちないよう、使うときに getSecret で読む
import { createClient } from "microcms-js-sdk";
import { getSecret } from "astro:env/server";
import contactsSchema from "@schema/contacts.json";
import { CONTACT } from "@constants/index.ts";

export type ContactInput = {
  name: string;
  email: string;
  category: string;
  message: string;
  agree: boolean;
};

export type ContactErrors = Partial<
  Record<keyof ContactInput | "form", string>
>;

// ---- 項目名と選択肢（schema/contacts.json から読む。CLAUDE.md の「API の項目定義」）

type SchemaField = {
  fieldId: string;
  name: string;
  selectItems?: { id: string; value: string }[];
};
const fieldById = new Map(
  (contactsSchema.apiFields as SchemaField[]).map((field) => [
    field.fieldId,
    field,
  ])
);

// 画面に出す項目名（microCMS の表示名そのまま）
export const contactLabel = (fieldId: string) =>
  fieldById.get(fieldId)?.name ?? fieldId;

// セレクト項目の選択肢（設定ファイルの並び順のまま）
export const contactSelectOptions = (fieldId: string) =>
  (fieldById.get(fieldId)?.selectItems ?? []).map((item) => item.value);

// ---- 設定

// 必要な変数がそろっているか（そろっていない間はフォームを「準備中」と表示し、送信されても保存しない）
// Turnstile のキーは、microCMS の contacts API とキーの権限を用意してから登録する（docs/contact.md の「設定の手順」）
export const contactAvailable = () =>
  Boolean(
    getSecret("TURNSTILE_SITE_KEY") &&
    getSecret("TURNSTILE_SECRET_KEY") &&
    getSecret("MICROCMS_SERVICE_DOMAIN") &&
    getSecret("MICROCMS_API_KEY")
  );

export const turnstileSiteKey = () => getSecret("TURNSTILE_SITE_KEY") ?? "";

// ---- 入力のチェック

// メールアドレスの形式が正しくないときのエラー文（画面側の形式チェックでも同じ文を出す）
export const emailFormatMessage = `${contactLabel("email")}の形式が正しくありません。`;

export const readContactForm = (form: FormData): ContactInput => ({
  name: String(form.get("name") ?? "").trim(),
  email: String(form.get("email") ?? "").trim(),
  category: String(form.get("category") ?? ""),
  message: String(form.get("message") ?? "").trim(),
  agree: form.get("agree") === "on",
});

// 問題があれば項目ごとのエラー文を返す
export const validateContact = (input: ContactInput): ContactErrors => {
  const errors: ContactErrors = {};
  const tooLong = (fieldId: keyof typeof CONTACT.maxLength) =>
    `${contactLabel(fieldId)}は${CONTACT.maxLength[fieldId]}文字以内で入力してください。`;

  if (!input.name) errors.name = `${contactLabel("name")}を入力してください。`;
  else if (input.name.length > CONTACT.maxLength.name)
    errors.name = tooLong("name");
  if (!input.email)
    errors.email = `${contactLabel("email")}を入力してください。`;
  else if (input.email.length > CONTACT.maxLength.email)
    errors.email = tooLong("email");
  else if (!new RegExp(CONTACT.emailPattern).test(input.email))
    errors.email = emailFormatMessage;
  if (!contactSelectOptions("category").includes(input.category))
    errors.category = `${contactLabel("category")}を選んでください。`;
  if (!input.message)
    errors.message = `${contactLabel("message")}を入力してください。`;
  else if (input.message.length > CONTACT.maxLength.message)
    errors.message = tooLong("message");
  if (!input.agree) errors.agree = "プライバシーポリシーへの同意が必要です。";
  return errors;
};

// ---- 自動送信よけと保存

// Turnstile の確認（https://developers.cloudflare.com/turnstile/get-started/server-side-validation/）
// 証明（token）は1回の確認にしか使えないため、同じ送信を繰り返しても通らない
export const verifyTurnstile = async (token: string, ip: string | null) => {
  const secret = getSecret("TURNSTILE_SECRET_KEY");
  if (!token || !secret) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body }
  );
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
};

// microCMS に下書きで保存する（下書きなのでサイトに公開されることはない）
// キーは共通の MICROCMS_API_KEY。microCMS でこのキーに contacts の POST だけを足す（docs/microcms.md の「API キー」）
export const saveContact = async (input: ContactInput) => {
  const client = createClient({
    serviceDomain: getSecret("MICROCMS_SERVICE_DOMAIN") ?? "",
    apiKey: getSecret("MICROCMS_API_KEY") ?? "",
  });
  await client.create({
    endpoint: CONTACT.endpoint,
    isDraft: true,
    content: {
      name: input.name,
      email: input.email,
      // セレクトの値は配列で送る
      category: [input.category],
      message: input.message,
    },
  });
};
