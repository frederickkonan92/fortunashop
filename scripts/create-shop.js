var { createClient } = require('@supabase/supabase-js')
var dotenv = require('dotenv')
var path = require('path')
var readline = require('readline')

// Charge les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

var supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Fonction pour générer un slug à partir du nom
// Exemple : "Mariam Mode" → "mariam-mode"
// Exemple : "Café Délice" → "cafe-delice"
var generateSlug = function(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Génère un mot de passe aléatoire de 8 caractères
// Mélange lettres et chiffres pour être facile à communiquer par WhatsApp
var generatePassword = function() {
  var chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  var pwd = ''
  for (var i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pwd
}

// Pose une question dans le terminal et retourne la réponse
var ask = function(rl, question) {
  return new Promise(function(resolve) {
    rl.question(question, function(answer) {
      resolve(answer.trim())
    })
  })
}

async function main() {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log('\n========================================')
  console.log('  CREATION BOUTIQUE FORTUNASHOP')
  console.log('========================================\n')

  // Étape 1 — Questions interactives
  var shopName = await ask(rl, '1. Nom de la boutique : ')
  if (!shopName) {
    console.error('Le nom est obligatoire.')
    rl.close()
    process.exit(1)
  }

  var slugInput = await ask(rl, '2. Slug (vide = auto depuis le nom) : ')
  var slug = slugInput || generateSlug(shopName)

  var description = await ask(rl, '3. Description : ')

  var planInput = await ask(rl, '4. Plan [starter/pro/premium] (defaut: starter) : ')
  var plan = ['starter', 'pro', 'premium'].includes(planInput) ? planInput : 'starter'

  var phone = await ask(rl, '5. Telephone WhatsApp : ')
  if (!phone) {
    console.error('Le telephone est obligatoire.')
    rl.close()
    process.exit(1)
  }

  var waveNumber = await ask(rl, '6. Numero Wave (vide = meme que WhatsApp) : ')
  var orangeNumber = await ask(rl, '7. Numero Orange Money (vide si pas applicable) : ')
  var mtnNumber = await ask(rl, '8. Numero MTN MoMo (vide si pas applicable) : ')

  var email = await ask(rl, '9. Email artisan (pour le compte admin) : ')
  if (!email) {
    console.error('L\'email est obligatoire.')
    rl.close()
    process.exit(1)
  }

  var passwordInput = await ask(rl, '10. Mot de passe temporaire (vide = auto) : ')
  var password = passwordInput || generatePassword()

  var addonsInput = await ask(rl, '11. Addons (separes par des virgules, ou vide) : ')
  var addons = addonsInput ? addonsInput.split(',').map(function(a) { return a.trim() }).filter(Boolean) : []

  rl.close()

  // Étape 2 — Vérifier que le slug n'existe pas déjà
  console.log('\nVerification du slug "' + slug + '"...')
  var slugCheck = await supabase.from('shops').select('id').eq('slug', slug).single()
  if (slugCheck.data) {
    console.error('Erreur : le slug "' + slug + '" existe deja dans la base.')
    process.exit(1)
  }

  // Étape 3 — Créer le compte Auth
  console.log('Creation du compte Auth...')
  var authResult = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  })

  if (authResult.error) {
    console.error('Erreur creation compte:', authResult.error.message)
    process.exit(1)
  }

  var userId = authResult.data.user.id
  console.log('Compte cree : ' + email + ' (ID: ' + userId + ')')

  // Étape 4 — Créer la boutique dans shops
  console.log('Creation de la boutique...')
  var shopResult = await supabase.from('shops').insert({
    name: shopName,
    slug: slug,
    description: description,
    phone: phone,
    plan: plan,
    wave_number: waveNumber || phone,
    orange_number: orangeNumber || null,
    mtn_number: mtnNumber || null,
    owner_id: userId,
    is_active: true,
    onboarding_completed: false,
    addons: addons.length > 0 ? addons : [],
  }).select().single()

  if (shopResult.error) {
    console.error('Erreur creation boutique:', shopResult.error.message)
    // Si la boutique échoue, on supprime le compte Auth créé
    await supabase.auth.admin.deleteUser(userId)
    console.log('Compte Auth supprime (rollback)')
    process.exit(1)
  }

  console.log('Boutique creee : ' + shopName + ' (' + slug + ')')

  // Étape 5 — Récapitulatif
  console.log('\n========================================')
  console.log('  BOUTIQUE CREEE AVEC SUCCES')
  console.log('========================================')
  console.log('')
  console.log('  Boutique : ' + shopName)
  console.log('  Slug     : ' + slug)
  console.log('  Plan     : ' + plan)
  console.log('  URL      : https://fortunashop.fr/boutique/' + slug)
  console.log('')
  console.log('  --- Identifiants artisan ---')
  console.log('  Email    : ' + email)
  console.log('  MDP      : ' + password)
  console.log('  Admin    : https://fortunashop.fr/admin/login')
  console.log('')
  console.log('  --- Message WhatsApp a envoyer ---')
  console.log('')

  var waMessage = 'Votre boutique est prete !\n\n'
    + 'Lien boutique : https://fortunashop.fr/boutique/' + slug + '\n\n'
    + 'Pour gerer vos commandes :\n'
    + 'https://fortunashop.fr/admin/login\n'
    + 'Email : ' + email + '\n'
    + 'Mot de passe : ' + password + '\n\n'
    + 'Un guide de demarrage vous attend a la connexion !'

  console.log(waMessage)
  console.log('')
  console.log('========================================')
}

main()
