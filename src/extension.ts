import * as vscode from 'vscode';
import { BuildAnalyzerProvider } from './BuildAnalyzerProvider';

let provider: BuildAnalyzerProvider;

interface ManualBuildPair {
  label?: string;
  folder: string;
  map: string;
  elf: string;
}

export function activate(context: vscode.ExtensionContext) {
  const cfg = vscode.workspace.getConfiguration('stm32BuildAnalyzerEnhanced');
  const debug = cfg.get<boolean>('debug') ?? false;

  if (debug) {
    console.log('[STM32 Extension] Activating extension...');
  }

  provider = new BuildAnalyzerProvider(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('stm32BuildAnalyzerEnhanced.openTab', async () => {
      if (debug) {console.log('[STM32 Extension] Command: openTab');}
      await vscode.commands.executeCommand(
        'workbench.view.extension.buildAnalyzerEnhancedPanel'
      );
    }),
    vscode.commands.registerCommand('stm32BuildAnalyzerEnhanced.refresh', () => {
      if (debug) {console.log('[STM32 Extension] Command: refresh');}
      return provider.refresh();
    }),

    vscode.commands.registerCommand('stm32BuildAnalyzerEnhanced.refreshPaths', () => {
      if (debug) {console.log('[STM32 Extension] Command: refreshPaths');}
      return provider.fullRefresh();
    }),
    vscode.commands.registerCommand('stm32BuildAnalyzerEnhanced.addManualPair', async () => {
      if (debug) {console.log('[STM32 Extension] Command: addManualPair');}
      await addManualPair(debug);
    }),

    vscode.window.registerWebviewViewProvider('buildAnalyzerEnhanced', provider)
  );

  if (debug) {
    console.log('[STM32 Extension] Commands and WebviewViewProvider registered.');
  }
}

async function addManualPair(debug: boolean) {
  const label = await vscode.window.showInputBox({
    prompt: 'Label for the build pair (optional)',
    placeHolder: 'Release build',
  });
  if (label === undefined) {return;}

  const folder = await vscode.window.showInputBox({
    prompt: 'Build folder path (absolute or workspace-relative)',
    placeHolder: 'build/Release',
  });
  if (!folder) {return;}

  const map = await vscode.window.showInputBox({
    prompt: 'Map file path (absolute or relative to the build folder)',
    placeHolder: 'firmware.map',
  });
  if (!map) {return;}

  const elf = await vscode.window.showInputBox({
    prompt: 'ELF file path (absolute or relative to the build folder)',
    placeHolder: 'firmware.out',
  });
  if (!elf) {return;}

  const scopePick = await vscode.window.showQuickPick(
    [
      { label: 'Workspace', target: vscode.ConfigurationTarget.Workspace },
      { label: 'User', target: vscode.ConfigurationTarget.Global },
    ],
    { placeHolder: 'Where should this manual pair be stored?' }
  );
  if (!scopePick) {return;}

  const cfg = vscode.workspace.getConfiguration('stm32BuildAnalyzerEnhanced');
  const current = cfg.get<ManualBuildPair[]>('manualBuildPairs') ?? [];
  const next: ManualBuildPair[] = [
    ...current,
    {
      label: label?.trim() || undefined,
      folder: folder.trim(),
      map: map.trim(),
      elf: elf.trim(),
    },
  ];

  await cfg.update('manualBuildPairs', next, scopePick.target);
  vscode.window.showInformationMessage('STM32 Build Analyzer: manual pair added.');

  if (debug) {
    console.log('[STM32 Extension] Manual pair added:', next[next.length - 1]);
  }
}

export function deactivate() {
  if (provider) {
    provider.dispose();
  }
}
