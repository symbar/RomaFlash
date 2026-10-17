import fs from 'fs';
import path from 'path';

const SQUAD_PLAYERS = [
  { id: '7048', name: 'De Marzi', fullName: 'Gabriele De Marzi', role: 'P', slug: 'demarzi' },
  { id: '610',  name: 'Gollini', fullName: 'Pierluigi Gollini', role: 'P', slug: 'gollini' },
  { id: '5841', name: 'Svilar', fullName: 'Mile Svilar', role: 'P', slug: 'svilar' },
  { id: '6125', name: 'Vasquez D.', fullName: 'Devis Vasquez', role: 'P', slug: 'vasquez' },
  { id: '6631', name: 'Ghilardi', fullName: 'Daniele Ghilardi', role: 'D', slug: 'ghilardi' },
  { id: '4807', name: 'Hermoso', fullName: 'Mario Hermoso', role: 'D', slug: 'hermoso' },
  { id: '7529', name: 'Koulierakis', fullName: 'Konstantinos Koulierakis', role: 'D', slug: 'koulierakis' },
  { id: '2296', name: 'Mancini', fullName: 'Gianluca Mancini', role: 'D', slug: 'mancini' },
  { id: '4317', name: "N'Dicka", fullName: 'Evan N\'Dicka', role: 'D', slug: 'ndicka' },
  { id: '6986', name: 'Rensch', fullName: 'Devyne Rensch', role: 'D', slug: 'rensch' },
  { id: '7181', name: 'Wesley', fullName: 'Wesley Gassova', role: 'D', slug: 'wesley' },
  { id: '4998', name: 'Molina N.', fullName: 'Nahuel Molina', role: 'D', slug: 'molina' },
  { id: '7599', name: 'Lulli', fullName: 'Tommaso Lulli', role: 'D', slug: 'lulli' },
  { id: '4705', name: 'Balerdi', fullName: 'Leonardo Balerdi', role: 'D', slug: 'balerdi' },
  { id: '22',   name: 'De Roon', fullName: 'Marten De Roon', role: 'C', slug: 'deroon' },
  { id: '779',  name: 'Cristante', fullName: 'Bryan Cristante', role: 'C', slug: 'cristante' },
  { id: '5589', name: 'Konè M.', fullName: 'Manu Koné', role: 'C', slug: 'kone' },
  { id: '6190', name: 'Pisilli', fullName: 'Niccolò Pisilli', role: 'C', slug: 'pisilli' },
  { id: '530',  name: 'Pellegrini Lo.', fullName: 'Lorenzo Pellegrini', role: 'C', slug: 'pellegrini' },
  { id: '7556', name: 'Mora', fullName: 'Giacomo Mora', role: 'C', slug: 'mora' },
  { id: '5734', name: 'Soulè', fullName: 'Matías Soulé', role: 'A', slug: 'soule' },
  { id: '309',  name: 'Dybala', fullName: 'Paulo Dybala', role: 'A', slug: 'dybala' },
  { id: '6572', name: 'Castro S.', fullName: 'Santiago Castro', role: 'A', slug: 'castro' },
  { id: '5585', name: 'Malen', fullName: 'Donyell Malen', role: 'A', slug: 'malen' }
];

async function downloadSquad() {
  const targetDir = path.join(process.cwd(), 'public', 'images', 'players');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Starting download of ${SQUAD_PLAYERS.length} Roma players into: ${targetDir}`);

  const catalog = [];

  for (const p of SQUAD_PLAYERS) {
    const url = `https://content.fantacalcio.it/web/campioncini/21/large/${p.id}.png`;
    const fileName = `${p.slug}.png`;
    const filePath = path.join(targetDir, fileName);

    console.log(`Downloading [${p.role}] ${p.name} (${p.slug})...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      console.error(`Failed to download ${p.name}: HTTP ${res.status}`);
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buf);

    catalog.push({
      id: p.id,
      name: p.name,
      fullName: p.fullName,
      role: p.role,
      slug: p.slug,
      imagePath: `/images/players/${fileName}`,
      fileSize: buf.byteLength
    });
  }

  // Write catalog JSON
  const catalogPath = path.join(targetDir, 'players.json');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');

  console.log(`\nDownload and catalog completed successfully!`);
  console.log(`Total players saved: ${catalog.length}`);
  console.log(`Catalog file created at: ${catalogPath}`);
}

downloadSquad().catch(console.error);
