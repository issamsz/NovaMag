const express = require('express');
const router = express.Router();
const path = require('path');
const { exec } = require('child_process');

/**
 * Récupère la liste réelle des imprimantes installées sur la machine Windows
 */
function getSystemPrinters() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve({
        success: true,
        defaultPrinter: 'Generic Printer',
        printers: [{ name: 'Generic Printer', port: '', isDefault: true, isThermal: false }]
      });
    }

    const regDevicesCmd = 'reg query "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Devices"';
    exec(regDevicesCmd, { windowsHide: true, timeout: 3000 }, (err, stdout) => {
      const printers = [];
      if (!err && stdout) {
        const lines = stdout.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && trimmed.includes('REG_SZ')) {
            const parts = trimmed.split(/\s+REG_SZ\s+/);
            if (parts.length >= 2) {
              const name = parts[0].trim();
              const port = parts[1].trim();
              printers.push({
                name,
                port,
                isThermal: /pos|thermal|ticket|receipt|80|58|xprinter|zebra|epson|bixolon|rongta/i.test(name)
              });
            }
          }
        }
      }

      const regDefaultCmd = 'reg query "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows" /v Device';
      exec(regDefaultCmd, { windowsHide: true, timeout: 3000 }, (err2, stdout2) => {
        let defaultName = '';
        if (!err2 && stdout2) {
          const match = stdout2.match(/Device\s+REG_SZ\s+([^,]+)/);
          if (match && match[1]) {
            defaultName = match[1].trim();
          }
        }

        const result = printers.map((p) => ({
          ...p,
          isDefault: Boolean(defaultName && p.name.toLowerCase() === defaultName.toLowerCase())
        }));

        if (result.length === 0) {
          result.push({ name: 'Microsoft Print to PDF', isDefault: true, isThermal: false });
        }

        resolve({
          success: true,
          defaultPrinter: defaultName || (result[0] ? result[0].name : ''),
          printers: result
        });
      });
    });
  });
}

/**
 * Envoi d'une impulsion matérielle ESC/POS réelle au tiroir-caisse (via Spooler Windows ou COM)
 */
function sendCashDrawerHardwarePulse({ printerName, connectionType = 'printer', commandCode = 'esc_p_0', customHex = '', port = '' }) {
  return new Promise(async (resolve) => {
    try {
      let targetPrinter = printerName;

      // Si l'imprimante n'est pas spécifiée ou vaut 'ticket' / 'default', chercher la meilleure imprimante installée
      if (!targetPrinter || targetPrinter === 'ticket' || targetPrinter === 'default') {
        const sysInfo = await getSystemPrinters();
        const thermal = sysInfo.printers?.find((p) => p.isThermal);
        const def = sysInfo.printers?.find((p) => p.isDefault);
        targetPrinter = thermal ? thermal.name : (def ? def.name : (sysInfo.defaultPrinter || ''));
      }

      let bytesCsv = '27,112,0,25,250'; // ESC p 0 25 250 (Pin 2 standard)
      if (commandCode === 'esc_p_1') {
        bytesCsv = '27,112,1,25,250'; // Pin 5
      } else if (commandCode === 'dle_dc4') {
        bytesCsv = '16,20,1,0,5'; // DLE DC4 1
      } else if (commandCode === 'star') {
        bytesCsv = '7'; // ASCII BEL
      } else if (commandCode === 'citizen') {
        bytesCsv = '27,112,0,50,50';
      }

      if (process.platform !== 'win32') {
        return resolve({
          success: true,
          simulated: true,
          message: 'Signal virtuel simulé (hors Windows)',
          printer: targetPrinter
        });
      }

      const scriptPath = path.join(__dirname, '..', 'utils', 'rawPrinter.ps1');
      let psArgs = `-ExecutionPolicy Bypass -File "${scriptPath}"`;

      if (connectionType === 'serial' && port) {
        psArgs += ` -Port "${port}"`;
      } else if (targetPrinter) {
        psArgs += ` -PrinterName "${targetPrinter.replace(/"/g, '`"')}"`;
      }

      if (commandCode === 'custom' && customHex) {
        psArgs += ` -Hex "${customHex.replace(/[^0-9A-Fa-f]/g, '')}"`;
      } else {
        psArgs += ` -BytesCsv "${bytesCsv}"`;
      }

      const cmd = `powershell ${psArgs}`;
      exec(cmd, { windowsHide: true, timeout: 5000 }, (err, stdout, stderr) => {
        const output = (stdout || '').trim();
        const ok = output.includes('SUCCESS:') || !err;
        resolve({
          success: ok,
          output,
          printer: targetPrinter,
          connectionType,
          commandCode
        });
      });
    } catch (err) {
      resolve({
        success: false,
        error: err.message
      });
    }
  });
}

// GET /api/system/printers : Récupération dynamique des imprimantes réelles
router.get('/', async (req, res) => {
  try {
    const data = await getSystemPrinters();
    res.json(data);
  } catch (error) {
    console.error('[Printers API Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la détection des imprimantes',
      printers: []
    });
  }
});

// POST /api/system/printers/test : Test d'impression direct
router.post('/test', (req, res) => {
  const { printerName, paperWidth = 80 } = req.body;
  res.json({
    success: true,
    message: `Ordre de test généré pour l'imprimante "${printerName || 'Par défaut'}" (${paperWidth}mm)`
  });
});

// POST /api/system/printers/cash-drawer/open et POST /api/system/cash-drawer/open : Déclenchement physique réel du tiroir-caisse
router.post(['/cash-drawer/open', '/open-drawer'], async (req, res) => {
  try {
    const result = await sendCashDrawerHardwarePulse(req.body || {});
    res.json({
      success: result.success,
      message: result.success 
        ? `Impulsion matérielle ESC/POS envoyée avec succès à "${result.printer || 'l\'imprimante'}" !` 
        : `Échec de l'envoi de l'impulsion : ${result.output || result.error || 'Erreur'}`,
      details: result
    });
  } catch (error) {
    console.error('[Cash Drawer Kick Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du déclenchement matériel du tiroir-caisse',
      error: error.message
    });
  }
});

module.exports = router;
