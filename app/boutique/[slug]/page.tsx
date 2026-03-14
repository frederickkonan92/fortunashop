import CatalogueClient from './catalogue'

export default async function BoutiquePage({ params }: any) {
  const { slug } = await params
  return <CatalogueClient slug={slug} />
}
