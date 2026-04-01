// Script de verification de sante du projet
// Lance : node scripts/check-health.js

var { createClient } = require('@supabase/supabase-js')
var dotenv = require('dotenv')
var path = require('path')
var fs = require('fs')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

var supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

var passed = 0
var failed = 0

async function check(name, fn) {
  try {
    var result = await fn()
    if (result) {
      console.log('  OK  ' + name)
      passed++
    } else {
      console.log('  FAIL  ' + name)
      failed++
    }
  } catch (err) {
    console.log('  FAIL  ' + name + ' — ' + err.message)
    failed++
  }
}

async function run() {
  console.log('\n=== HEALTH CHECK fortunashop ===\n')

  // 1. Variables d'environnement
  await check('NEXT_PUBLIC_SUPABASE_URL est defini', function() {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL
  })
  await check('SUPABASE_SERVICE_ROLE_KEY est defini', function() {
    return !!process.env.SUPABASE_SERVICE_ROLE_KEY
  })
  await check('BREVO_API_KEY est defini', function() {
    return !!process.env.BREVO_API_KEY
  })
  await check('ANTHROPIC_API_KEY est defini', function() {
    return !!process.env.ANTHROPIC_API_KEY
  })

  // 2. Connexion Supabase
  await check('Connexion Supabase fonctionne', async function() {
    var { data, error } = await supabase.from('shops').select('count').limit(1)
    return !error
  })

  // 3. Boutiques de test existent
  await check('boutique-test existe', async function() {
    var { data } = await supabase.from('shops').select('slug').eq('slug', 'boutique-test').single()
    return !!data
  })
  await check('kente-fashion-test existe', async function() {
    var { data } = await supabase.from('shops').select('slug').eq('slug', 'kente-fashion-test').single()
    return !!data
  })

  // 4. Tables critiques existent
  var tables = ['shops', 'products', 'orders', 'order_items', 'leads', 'livreurs', 'delivery_tokens', 'page_views']
  for (var i = 0; i < tables.length; i++) {
    var table = tables[i]
    await check('Table ' + table + ' accessible', async function() {
      var { error } = await supabase.from(table).select('count').limit(1)
      return !error
    })
  }

  // 5. Fichiers critiques existent
  var criticalFiles = [
    'app/page.tsx',
    'app/boutique/[slug]/catalogue.tsx',
    'app/boutique/[slug]/commander/page.tsx',
    'app/admin/dashboard/page.tsx',
    'app/admin/page.tsx',
    'app/api/leads/route.ts',
    'lib/supabase.js',
    'lib/utils.ts',
    'components/cart.tsx',
    'components/onboarding.tsx',
    'CLAUDE.md',
  ]
  for (var j = 0; j < criticalFiles.length; j++) {
    var file = criticalFiles[j]
    await check('Fichier ' + file + ' existe', function() {
      return fs.existsSync(path.resolve(__dirname, '..', file))
    })
  }

  // Resume
  console.log('\n=== RESULTAT ===')
  console.log('  Passes : ' + passed)
  console.log('  Echoues : ' + failed)
  console.log('')

  if (failed > 0) {
    console.log('  DES CHECKS ONT ECHOUE — verifier avant de deployer')
    process.exit(1)
  } else {
    console.log('  TOUT EST OK')
  }
}

run()
