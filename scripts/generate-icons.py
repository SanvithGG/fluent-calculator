"""
Generate all Windows Store and Tauri icon sizes from the new Fluent Calculator logo.
"""
import os
from PIL import Image

def main():
    source_path = r"S:\Tech_Coding\Projects\Calculator\src\assets\final_logo_fluent.png"
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found")
        return

    src_img = Image.open(source_path).convert("RGBA")
    print(f"Loaded source logo: {src_img.size}")

    # Destination directories
    icons_dir = r"S:\Tech_Coding\Projects\Calculator\src-tauri\icons"
    assets_dir = r"S:\Tech_Coding\Projects\Calculator\src\assets"
    public_dir = r"S:\Tech_Coding\Projects\Calculator\public"
    os.makedirs(icons_dir, exist_ok=True)
    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    # 1. Update logo.png in src/assets and public/
    logo_512 = src_img.resize((512, 512), Image.Resampling.LANCZOS)
    logo_512.save(os.path.join(assets_dir, "logo.png"))
    logo_512.save(os.path.join(public_dir, "logo.png"))
    print("Saved logo.png (512x512)")

    # 2. Windows Store & Tauri standard icons mapping
    icon_sizes = {
        "32x32.png": (32, 32),
        "64x64.png": (64, 64),
        "128x128.png": (128, 128),
        "128x128@2x.png": (256, 256),
        "icon.png": (512, 512),
        "Square30x30Logo.png": (30, 30),
        "Square44x44Logo.png": (44, 44),
        "Square71x71Logo.png": (71, 71),
        "Square89x89Logo.png": (89, 89),
        "Square107x107Logo.png": (107, 107),
        "Square142x142Logo.png": (142, 142),
        "Square150x150Logo.png": (150, 150),
        "Square284x284Logo.png": (284, 284),
        "Square310x310Logo.png": (310, 310),
        "StoreLogo.png": (50, 50),
    }

    for filename, size in icon_sizes.items():
        resized = src_img.resize(size, Image.Resampling.LANCZOS)
        out_path = os.path.join(icons_dir, filename)
        resized.save(out_path)
        print(f"Saved {filename} ({size[0]}x{size[1]})")

    # 3. Generate Multi-size Windows ICO file
    ico_path = os.path.join(icons_dir, "icon.ico")
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    src_img.save(ico_path, format="ICO", sizes=ico_sizes)
    src_img.save(os.path.join(public_dir, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Saved icon.ico with all Windows sizes (16..256)")

    print("\nAll icon assets successfully generated!")

if __name__ == "__main__":
    main()
