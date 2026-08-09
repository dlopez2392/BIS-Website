/**
 * One place that turns a schema object into a script tag. `<` is escaped
 * because JSON.stringify will happily emit a literal `</script>` if any string
 * in the data ever contains one, which would end the block early.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
