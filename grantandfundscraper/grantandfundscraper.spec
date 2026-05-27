# -*- mode: python ; coding: utf-8 -*-
#
# PyInstaller spec for GrantAndFundScraper.
# Use build.py to invoke this correctly with build-time secrets injected.
# Direct invocation: pyinstaller grantandfundscraper.spec
#
# NOTE: When using build.py, this spec is not used directly — build.py passes
# all arguments via CLI. This spec is provided as a reference / alternative.

import os
import sys
from pathlib import Path

block_cipher = None
ROOT = Path(SPECPATH)

a = Analysis(
    [str(ROOT / 'main.py')],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[
        (str(ROOT / 'app' / 'templates'), 'app/templates'),
        (str(ROOT / 'client_secrets.json'), '.'),
    ],
    hiddenimports=[
        'flask',
        'jinja2',
        'werkzeug',
        'anthropic',
        'openpyxl',
        'google.auth',
        'google.auth.transport.requests',
        'google_auth_oauthlib.flow',
        'googleapiclient.discovery',
        'googleapiclient.errors',
        'duckduckgo_search',
        'bs4',
        'lxml',
        'requests',
        'pytz',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='GrantAndFundScraper',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,        # No terminal window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=(
        str(ROOT / 'assets' / 'icon.icns')
        if sys.platform == 'darwin'
        else str(ROOT / 'assets' / 'icon.ico')
        if sys.platform == 'win32'
        else None
    ),
)

# Mac: wrap in .app bundle
if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='GrantAndFundScraper.app',
        icon=str(ROOT / 'assets' / 'icon.icns'),
        bundle_identifier='org.documentary411.grantandfundscraper',
        info_plist={
            'NSHighResolutionCapable': True,
            'LSUIElement': False,
        },
    )
