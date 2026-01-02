export async function generateUniqueSlugWithCheck(title: string, Model: any) {
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let exists = await Model.findOne({ slug });

  while (exists) {
    const extra = Math.random().toString(36).substring(2, 6);
    slug = `${slug}-${extra}`;
    exists = await Model.findOne({ slug });
  }

  return slug;
}
