import { Metadata } from 'next'
import CollecteContent from './collecte-content'

export var metadata: Metadata = {
  title: "fortunashop — Ce dont j'ai besoin pour créer ta boutique",
  description: "Guide simple pour préparer la création de ta boutique en ligne fortunashop.",
  robots: 'noindex',
}

export default function CollectePage() {
  return <CollecteContent />
}
