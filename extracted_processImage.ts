  const processImage = () => {
    const srcCanvas = sourceCanvasRef.current;
    const outCanvas = outputCanvasRef.current;
    if (!srcCanvas || !outCanvas || !loadedImage) return;

    const ctx = srcCanvas.getContext('2d');
    const outCtx = outCanvas.getContext('2d');
    if (!ctx || !outCtx) return;

    setIsProcessing(true);

    const img = loadedImage;
    // Set canvas dimension based on image aspect ratio, but constrain to a max size for quick processing
    const maxDimension = 320; // Crisp pixel size
    let width = img.width;
    let height = img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    if (srcCanvas.width !== width || srcCanvas.height !== height) {
      srcCanvas.width = width;
      srcCanvas.height = height;
    }
    if (outCanvas.width !== width || outCanvas.height !== height) {
      outCanvas.width = width;
      outCanvas.height = height;
    }

    // Draw original image to hidden source canvas
    ctx.drawImage(img, 0, 0, width, height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const length = data.length;

      // Prepare an intermediate array for edits and math computations
      const rBuffer = new Float32Array(width * height);
      const gBuffer = new Float32Array(width * height);
      const bBuffer = new Float32Array(width * height);

      // Pre-apply Adjustments (Brightness, Contrast, Gamma, Invert)
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < length; i += 4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        // 1. Invert
        if (invert) {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        // 2. Brightness
        r += brightness;
        g += brightness;
        b += brightness;

        // 3. Contrast
        r = (r - 128) * contrastFactor + 128;
        g = (g - 128) * contrastFactor + 128;
        b = (b - 128) * contrastFactor + 128;

        // 4. Gamma
        if (gamma !== 1.0) {
          r = 255 * Math.pow(Math.max(0, r) / 255, 1 / gamma);
          g = 255 * Math.pow(Math.max(0, g) / 255, 1 / gamma);
          b = 255 * Math.pow(Math.max(0, b) / 255, 1 / gamma);
        }

        // Clip values
        const idx = i / 4;
        rBuffer[idx] = Math.min(255, Math.max(0, r));
        gBuffer[idx] = Math.min(255, Math.max(0, g));
        bBuffer[idx] = Math.min(255, Math.max(0, b));
      }

      // Pre-apply Simple Blur or Edge Enhance convolution if requested
      if (blur > 0) {
        const tempR = new Float32Array(rBuffer);
        const tempG = new Float32Array(gBuffer);
        const tempB = new Float32Array(bBuffer);
        // Simple box blur kernel
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            let sumR = 0, sumG = 0, sumB = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const kidx = (y + ky) * width + (x + kx);
                sumR += tempR[kidx];
                sumG += tempG[kidx];
                sumB += tempB[kidx];
              }
            }
            const currIdx = y * width + x;
            rBuffer[currIdx] = sumR / 9;
            gBuffer[currIdx] = sumG / 9;
            bBuffer[currIdx] = sumB / 9;
          }
        }
      }

      // Colors / Palettes map values
      const fgColor = hexToRgb(foreground);
      const bgColor = hexToRgb(background);
      const currentPalette = RETRO_PALETTES[selectedPaletteIndex].colors.map(hexToRgb);

      // Quantization utility mapping grayscale density
      const getClosestPaletteColor = (gray: number) => {
        // grayscale mapping to palette index
        const pct = Math.min(0.999, Math.max(0, gray / 255));
        const index = Math.floor(pct * currentPalette.length);
        return currentPalette[index];
      };

      // Dithering Algorithms Execution
      if (activeEffect === 'dithering') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        if (algorithm.startsWith('bayer-')) {
          // Bayer Ordered Dithering
          let bayerMatrix = BAYER_8X8;
          let bayerSize = 8;

          if (algorithm === 'bayer-2x2') {
            bayerMatrix = BAYER_2X2;
            bayerSize = 2;
          } else if (algorithm === 'bayer-4x4') {
            bayerMatrix = BAYER_4X4;
            bayerSize = 4;
          }

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const r = rBuffer[idx];
              const g = gBuffer[idx];
              const b = bBuffer[idx];
              
              // grayscale density
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;

              // get Bayer matrix threshold scaled to 0-255
              const threshold = (bayerMatrix[y % bayerSize][x % bayerSize] / (bayerSize * bayerSize)) * 255;
              const modulatedGray = gray + (modulation - 0.5) * 50;

              const outIdx = idx * 4;
              if (colorMode === 'mono') {
                const targetColor = modulatedGray > threshold ? fgColor : bgColor;
                out[outIdx] = targetColor.r;
                out[outIdx+1] = targetColor.g;
                out[outIdx+2] = targetColor.b;
                out[outIdx+3] = 255;
              } else if (colorMode === 'palette') {
                // Find matching palette color using dithered gray density
                const targetColor = getClosestPaletteColor(modulatedGray > threshold ? gray + 40 : gray - 40);
                out[outIdx] = targetColor.r;
                out[outIdx+1] = targetColor.g;
                out[outIdx+2] = targetColor.b;
                out[outIdx+3] = 255;
              } else {
                // Full Color Dithering
                const ditherR = r > threshold ? 255 : 0;
                const ditherG = g > threshold ? 255 : 0;
                const ditherB = b > threshold ? 255 : 0;
                out[outIdx] = ditherR;
                out[outIdx+1] = ditherG;
                out[outIdx+2] = ditherB;
                out[outIdx+3] = 255;
              }
            }
          }
        } else if (algorithm === 'crosshatch') {
          // Crosshatch dither lines drawing
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const r = rBuffer[idx];
              const g = gBuffer[idx];
              const b = bBuffer[idx];
              
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const outIdx = idx * 4;

              let isFilled = false;
              if (gray < 50) {
                // Very dark: Crosshatched lines
                isFilled = (x + y) % 4 === 0 || (x - y) % 4 === 0;
              } else if (gray < 110) {
                // Dark midtone: single diagonals
                isFilled = (x + y) % 4 === 0;
              } else if (gray < 180) {
                // Midtone: scattered dots
                isFilled = (x + y) % 6 === 0 && x % 2 === 0;
              } else {
                // Highlight: blank
                isFilled = false;
              }

              const targetColor = isFilled ? fgColor : bgColor;
              out[outIdx] = targetColor.r;
              out[outIdx+1] = targetColor.g;
              out[outIdx+2] = targetColor.b;
              out[outIdx+3] = 255;
            }
          }
        } else if (algorithm === 'blue-noise') {
          // Custom blue noise distribution threshold generator
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const r = rBuffer[idx];
              const g = gBuffer[idx];
              const b = bBuffer[idx];
              
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const outIdx = idx * 4;

              // Blue noise high-frequency pseudo formula
              const noiseVal = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
              const threshold = (noiseVal + 1) * 127.5;

              const targetColor = gray > threshold ? fgColor : bgColor;
              out[outIdx] = targetColor.r;
              out[outIdx+1] = targetColor.g;
              out[outIdx+2] = targetColor.b;
              out[outIdx+3] = 255;
            }
          }
        } else {
          // ERROR DIFFUSION ALGORITHMS (Floyd-Steinberg, Atkinson, Jarvis-Judice-Ninke, Stucki, Burkes, Sierra, etc.)
          const rError = new Float32Array(rBuffer);
          const gError = new Float32Array(gBuffer);
          const bError = new Float32Array(bBuffer);

          const errorDispersal = (x: number, y: number, errR: number, errG: number, errB: number, weight: number) => {
            if (x >= 0 && x < width && y >= 0 && y < height) {
              const nIdx = y * width + x;
              rError[nIdx] += errR * weight;
              gError[nIdx] += errG * weight;
              bError[nIdx] += errB * weight;
            }
          };

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const outIdx = idx * 4;

              const r = Math.min(255, Math.max(0, rError[idx]));
              const g = Math.min(255, Math.max(0, gError[idx]));
              const b = Math.min(255, Math.max(0, bError[idx]));

              const gray = 0.299 * r + 0.587 * g + 0.114 * b;

              let qR = 0, qG = 0, qB = 0;

              if (colorMode === 'mono') {
                const choice = gray > 127 ? fgColor : bgColor;
                qR = choice.r;
                qG = choice.g;
                qB = choice.b;
              } else if (colorMode === 'palette') {
                const choice = getClosestPaletteColor(gray);
                qR = choice.r;
                qG = choice.g;
                qB = choice.b;
              } else {
                qR = r > 127 ? 255 : 0;
                qG = g > 127 ? 255 : 0;
                qB = b > 127 ? 255 : 0;
              }

              out[outIdx] = qR;
              out[outIdx+1] = qG;
              out[outIdx+2] = qB;
              out[outIdx+3] = 255;

              // Compute error
              const errR = r - qR;
              const errG = g - qG;
              const errB = b - qB;

              // Distribute error based on active diffusion strategy
              if (algorithm === 'floyd-steinberg') {
                errorDispersal(x + 1, y, errR, errG, errB, 7 / 16);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 3 / 16);
                errorDispersal(x, y + 1, errR, errG, errB, 5 / 16);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 1 / 16);
              } else if (algorithm === 'atkinson') {
                errorDispersal(x + 1, y, errR, errG, errB, 1 / 8);
                errorDispersal(x + 2, y, errR, errG, errB, 1 / 8);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 1 / 8);
                errorDispersal(x, y + 1, errR, errG, errB, 1 / 8);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 1 / 8);
                errorDispersal(x, y + 2, errR, errG, errB, 1 / 8);
              } else if (algorithm === 'jarvis-judice-ninke') {
                errorDispersal(x + 1, y, errR, errG, errB, 7 / 48);
                errorDispersal(x + 2, y, errR, errG, errB, 5 / 48);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 3 / 48);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 5 / 48);
                errorDispersal(x, y + 1, errR, errG, errB, 7 / 48);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 5 / 48);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 3 / 48);
                errorDispersal(x - 2, y + 2, errR, errG, errB, 1 / 48);
                errorDispersal(x - 1, y + 2, errR, errG, errB, 3 / 48);
                errorDispersal(x, y + 2, errR, errG, errB, 5 / 48);
                errorDispersal(x + 1, y + 2, errR, errG, errB, 3 / 48);
                errorDispersal(x + 2, y + 2, errR, errG, errB, 1 / 48);
              } else if (algorithm === 'stucki') {
                errorDispersal(x + 1, y, errR, errG, errB, 8 / 42);
                errorDispersal(x + 2, y, errR, errG, errB, 4 / 42);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 2 / 42);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 4 / 42);
                errorDispersal(x, y + 1, errR, errG, errB, 8 / 42);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 4 / 42);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 2 / 42);
                errorDispersal(x - 2, y + 2, errR, errG, errB, 1 / 42);
                errorDispersal(x - 1, y + 2, errR, errG, errB, 2 / 42);
                errorDispersal(x, y + 2, errR, errG, errB, 4 / 42);
                errorDispersal(x + 1, y + 2, errR, errG, errB, 2 / 42);
                errorDispersal(x + 2, y + 2, errR, errG, errB, 1 / 42);
              } else if (algorithm === 'burkes') {
                errorDispersal(x + 1, y, errR, errG, errB, 8 / 32);
                errorDispersal(x + 2, y, errR, errG, errB, 4 / 32);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 2 / 32);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 4 / 32);
                errorDispersal(x, y + 1, errR, errG, errB, 8 / 32);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 4 / 32);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 2 / 32);
              } else if (algorithm === 'sierra') {
                errorDispersal(x + 1, y, errR, errG, errB, 5 / 32);
                errorDispersal(x + 2, y, errR, errG, errB, 3 / 32);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 2 / 32);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 4 / 32);
                errorDispersal(x, y + 1, errR, errG, errB, 5 / 32);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 4 / 32);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 2 / 32);
                errorDispersal(x - 1, y + 2, errR, errG, errB, 2 / 32);
                errorDispersal(x, y + 2, errR, errG, errB, 3 / 32);
                errorDispersal(x + 1, y + 2, errR, errG, errB, 2 / 32);
              } else if (algorithm === 'sierra-two-row') {
                errorDispersal(x + 1, y, errR, errG, errB, 4 / 16);
                errorDispersal(x + 2, y, errR, errG, errB, 3 / 16);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 1 / 16);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 2 / 16);
                errorDispersal(x, y + 1, errR, errG, errB, 3 / 16);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 2 / 16);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 1 / 16);
              } else if (algorithm === 'sierra-lite') {
                errorDispersal(x + 1, y, errR, errG, errB, 2 / 4);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 1 / 4);
                errorDispersal(x, y + 1, errR, errG, errB, 1 / 4);
              }
            }
          }
        }

        // Apply Chromatic Aberration Displacement if enabled
        if (chromaticEnabled) {
          const shiftR = maxDisplace;
          const shiftB = -maxDisplace;
          const originalOutput = new Uint8ClampedArray(out);

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              
              // Shift Red channel right
              if (x + shiftR < width) {
                const shiftIdx = (y * width + (x + shiftR)) * 4;
                out[shiftIdx] = originalOutput[idx];
              }
              // Shift Blue channel left
              if (x + shiftB >= 0) {
                const shiftIdx = (y * width + (x + shiftB)) * 4;
                out[shiftIdx+2] = originalOutput[idx+2];
              }
            }
          }
        }

        // Put processed output back on the main canvas
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'ascii') {
        // ASCII Canvas Renderer
        outCtx.fillStyle = asciiBgColor;
        outCtx.fillRect(0, 0, width, height);

        const charScale = asciiScale <= 1 ? 6 : asciiScale * 4;
        const spacingX = charScale + asciiSpacing;
        const spacingY = charScale + asciiSpacing + 2;

        outCtx.font = `bold ${charScale}px monospace`;
        outCtx.textAlign = 'left';

        let charList = " .:-=+*#%@";
        if (asciiCharSet === 'BLOCKS') charList = " ░▒▓█";
        else if (asciiCharSet === 'BINARY') charList = "01";
        else if (asciiCharSet === 'DETAILED') charList = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
        else if (asciiCharSet === 'MINIMAL') charList = " .oO@";
        else if (asciiCharSet === 'ALPHABETIC') charList = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        else if (asciiCharSet === 'NUMERIC') charList = " 0123456789";
        else if (asciiCharSet === 'MATH') charList = " +-=/X%";
        else if (asciiCharSet === 'SYMBOLS') charList = " !@#$%^&*()_+{}|:<>?[]\\;',./";
        else if (asciiCharSet === 'CUSTOM') charList = "@%#*+=-:. ";

        const currentAsciiGrid: string[][] = [];

        for (let y = 0; y < height; y += spacingY) {
          const gridRow: string[] = [];
          for (let x = 0; x < width; x += spacingX) {
            const rX = Math.floor(x);
            const rY = Math.floor(y);
            if (rX >= width || rY >= height) continue;

            // Sample grid patch
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (let sy = 0; sy < spacingY; sy++) {
              for (let sx = 0; sx < spacingX; sx++) {
                const px = rX + sx;
                const py = rY + sy;
                if (px < width && py < height) {
                  const pIdx = py * width + px;
                  sumR += rBuffer[pIdx];
                  sumG += gBuffer[pIdx];
                  sumB += bBuffer[pIdx];
                  count++;
                }
              }
            }
            if (count === 0) continue;

            let avgR = sumR / count;
            let avgG = sumG / count;
            let avgB = sumB / count;

            // Adjustments
            avgR += asciiBrightness;
            avgG += asciiBrightness;
            avgB += asciiBrightness;

            const asciiContrastFactor = (259 * (asciiContrast + 255)) / (255 * (259 - asciiContrast));
            avgR = (avgR - 128) * asciiContrastFactor + 128;
            avgG = (avgG - 128) * asciiContrastFactor + 128;
            avgB = (avgB - 128) * asciiContrastFactor + 128;

            if (asciiGamma !== 1.0) {
              avgR = 255 * Math.pow(Math.max(0, avgR) / 255, 1 / asciiGamma);
              avgG = 255 * Math.pow(Math.max(0, avgG) / 255, 1 / asciiGamma);
              avgB = 255 * Math.pow(Math.max(0, avgB) / 255, 1 / asciiGamma);
            }

            avgR = Math.min(255, Math.max(0, avgR));
            avgG = Math.min(255, Math.max(0, avgG));
            avgB = Math.min(255, Math.max(0, avgB));

            const gray = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
            const charIndex = Math.floor((gray / 255) * (charList.length - 1));
            const char = charList[charIndex] || ' ';
            gridRow.push(char);

            let charColor = `rgb(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`;
            if (asciiColorMode === 'Mono') {
              charColor = foreground;
            } else if (asciiColorMode === 'Palette') {
              const col = getClosestPaletteColor(gray);
              charColor = `rgb(${col.r}, ${col.g}, ${col.b})`;
            }

            outCtx.fillStyle = charColor;
            outCtx.fillText(char, x, y + charScale);
          }
          currentAsciiGrid.push(gridRow);
        }
        asciiCharGridRef.current = currentAsciiGrid;
      } else if (activeEffect === 'halftone') {
        // Halftone Grid Screen Renderer
        outCtx.fillStyle = halftoneBackground;
        outCtx.fillRect(0, 0, width, height);

        outCtx.save();
        outCtx.translate(width / 2, height / 2);
        outCtx.rotate((halftoneAngle * Math.PI) / 180);

        const diagonal = Math.ceil(Math.sqrt(width * width + height * height));
        const gridStart = -diagonal / 2;
        const gridEnd = diagonal / 2;
        const spacing = Math.max(4, halftoneSpacing);
        const maxRadius = (spacing / 2) * halftoneDotScale;

        for (let gy = gridStart; gy < gridEnd; gy += spacing) {
          for (let gx = gridStart; gx < gridEnd; gx += spacing) {
            // Un-rotate to find sample position in original image buffer
            const rad = (halftoneAngle * Math.PI) / 180;
            const origX = Math.round(gx * Math.cos(-rad) - gy * Math.sin(-rad) + width / 2);
            const origY = Math.round(gx * Math.sin(-rad) + gy * Math.cos(-rad) + height / 2);

            if (origX >= 0 && origX < width && origY >= 0 && origY < height) {
              const idx = origY * width + origX;
              let r = rBuffer[idx];
              let g = gBuffer[idx];
              let b = bBuffer[idx];

              r += halftoneBrightness;
              g += halftoneBrightness;
              b += halftoneBrightness;

              const hContrastFactor = (259 * (halftoneContrast + 255)) / (255 * (259 - halftoneContrast));
              r = (r - 128) * hContrastFactor + 128;
              g = (g - 128) * hContrastFactor + 128;
              b = (b - 128) * hContrastFactor + 128;

              r = Math.min(255, Math.max(0, r));
              g = Math.min(255, Math.max(0, g));
              b = Math.min(255, Math.max(0, b));

              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const intensityVal = halftoneInvert ? gray / 255 : (255 - gray) / 255;
              const radius = maxRadius * intensityVal;

              if (radius > 0.1) {
                let dotColor = halftoneForeground;
                if (halftoneColorMode === 'Original') {
                  dotColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
                } else if (halftoneColorMode === 'Palette') {
                  const col = getClosestPaletteColor(gray);
                  dotColor = `rgb(${col.r}, ${col.g}, ${col.b})`;
                }

                outCtx.fillStyle = dotColor;
                outCtx.beginPath();
                if (halftoneShape === 'Square') {
                  outCtx.rect(gx - radius, gy - radius, radius * 2, radius * 2);
                } else {
                  outCtx.arc(gx, gy, radius, 0, Math.PI * 2);
                }
                outCtx.fill();
              }
            }
          }
        }
        outCtx.restore();
      } else if (activeEffect === 'blockify') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const size = Math.max(2, Math.round(blockifySize));
        const borderWidth = Math.max(0, blockifyBorderWidth);
        const bContrastFactor = (259 * (blockifyContrast + 255)) / (255 * (259 - blockifyContrast));
        const borderCol = hexToRgb(blockifyBorderColor);

        for (let by = 0; by < height; by += size) {
          for (let bx = 0; bx < width; bx += size) {
            // Calculate average color for this block
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (let dy = 0; dy < size; dy++) {
              for (let dx = 0; dx < size; dx++) {
                const px = bx + dx;
                const py = by + dy;
                if (px < width && py < height) {
                  const pIdx = py * width + px;
                  sumR += rBuffer[pIdx];
                  sumG += gBuffer[pIdx];
                  sumB += bBuffer[pIdx];
                  count++;
                }
              }
            }

            if (count === 0) continue;

            let avgR = sumR / count;
            let avgG = sumG / count;
            let avgB = sumB / count;

            // Apply blockify brightness adjustment
            avgR += blockifyBrightness;
            avgG += blockifyBrightness;
            avgB += blockifyBrightness;

            // Apply blockify contrast adjustment
            avgR = (avgR - 128) * bContrastFactor + 128;
            avgG = (avgG - 128) * bContrastFactor + 128;
            avgB = (avgB - 128) * bContrastFactor + 128;

            avgR = Math.min(255, Math.max(0, avgR));
            avgG = Math.min(255, Math.max(0, avgG));
            avgB = Math.min(255, Math.max(0, avgB));

            // Apply color mode mapping
            let finalR = avgR;
            let finalG = avgG;
            let finalB = avgB;

            const gray = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

            if (blockifyColorMode === 'Mono') {
              const targetColor = gray > 127 ? fgColor : bgColor;
              finalR = targetColor.r;
              finalG = targetColor.g;
              finalB = targetColor.b;
            } else if (blockifyColorMode === 'Palette') {
              const targetColor = getClosestPaletteColor(gray);
              finalR = targetColor.r;
              finalG = targetColor.g;
              finalB = targetColor.b;
            }

            // Fill pixels for the block
            for (let dy = 0; dy < size; dy++) {
              for (let dx = 0; dx < size; dx++) {
                const px = bx + dx;
                const py = by + dy;
                if (px < width && py < height) {
                  const pIdx = (py * width + px) * 4;

                  // Check if this pixel is part of the border
                  // Border width determines spacing from block edges
                  const isBorder = (borderWidth > 0) && (
                    dx < borderWidth || 
                    dy < borderWidth || 
                    (size - dx - 1) < borderWidth || 
                    (size - dy - 1) < borderWidth
                  );

                  let r = finalR;
                  let g = finalG;
                  let b = finalB;

                  if (isBorder) {
                    r = borderCol.r;
                    g = borderCol.g;
                    b = borderCol.b;
                  } else if (blockifyStyle === 'Beveled Blocks') {
                    // Beveled blocks style: lighter top/left, darker bottom/right
                    const topOrLeft = (dx === Math.floor(borderWidth)) || (dy === Math.floor(borderWidth));
                    const bottomOrRight = (dx === size - 1 - Math.floor(borderWidth)) || (dy === size - 1 - Math.floor(borderWidth));
                    if (topOrLeft) {
                      r = Math.min(255, r + 40);
                      g = Math.min(255, g + 40);
                      b = Math.min(255, b + 40);
                    } else if (bottomOrRight) {
                      r = Math.max(0, r - 40);
                      g = Math.max(0, g - 40);
                      b = Math.max(0, b - 40);
                    }
                  } else if (blockifyStyle === 'Rounded Blocks') {
                    // Rounded blocks: skip the corners of the block inside the border
                    const insetX = dx - borderWidth;
                    const insetY = dy - borderWidth;
                    const innerSize = size - 2 * borderWidth;
                    const isCorner = (
                      (insetX < 1 && insetY < 1) ||
                      (insetX < 1 && insetY >= innerSize - 1) ||
                      (insetX >= innerSize - 1 && insetY < 1) ||
                      (insetX >= innerSize - 1 && insetY >= innerSize - 1)
                    );
                    if (isCorner && innerSize > 2) {
                      r = borderCol.r;
                      g = borderCol.g;
                      b = borderCol.b;
                    }
                  } else if (blockifyStyle === 'Grid Blocks') {
                    // Grid blocks: draw a dot or grid cell
                    const centerX = Math.floor(size / 2);
                    const centerY = Math.floor(size / 2);
                    const dist = Math.sqrt((dx - centerX) ** 2 + (dy - centerY) ** 2);
                    if (dist > (size / 2) - borderWidth) {
                      r = borderCol.r;
                      g = borderCol.g;
                      b = borderCol.b;
                    }
                  }

                  out[pIdx] = r;
                  out[pIdx+1] = g;
                  out[pIdx+2] = b;
                  out[pIdx+3] = 255;
                }
              }
            }
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'threshold') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const levels = Math.max(2, thresholdLevels);
        const contrastFactor = (259 * (thresholdContrast + 255)) / (255 * (259 - thresholdContrast));
        const fgCol = hexToRgb(thresholdForeground);
        const bgCol = hexToRgb(thresholdBackground);

        const bayer4x4 = [
          [0, 8, 2, 10],
          [12, 4, 14, 6],
          [3, 11, 1, 9],
          [15, 7, 13, 5]
        ];

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const pIdx = idx * 4;

            const origR = rBuffer[idx];
            const origG = gBuffer[idx];
            const origB = bBuffer[idx];

            let gray = 0.299 * origR + 0.587 * origG + 0.114 * origB;

            // Apply Brightness
            gray += thresholdBrightness;

            // Apply Contrast
            gray = (gray - 128) * contrastFactor + 128;
            gray = Math.max(0, Math.min(255, gray));

            // Apply Dither
            if (thresholdDither) {
              const ditherVal = ((bayer4x4[y % 4][x % 4] / 16) - 0.5) * (255 / (levels - 1));
              gray += ditherVal;
              gray = Math.max(0, Math.min(255, gray));
            }

            let norm = gray / 255;

            // Adjust based on Threshold Point
            if (thresholdPoint > 0 && thresholdPoint < 1) {
              if (norm < thresholdPoint) {
                norm = (norm / thresholdPoint) * 0.5;
              } else {
                norm = 0.5 + ((norm - thresholdPoint) / (1 - thresholdPoint)) * 0.5;
              }
            } else if (thresholdPoint === 0) {
              norm = 1.0;
            } else if (thresholdPoint === 1) {
              norm = 0.0;
            }

            // Quantize
            const levelIndex = Math.round(norm * (levels - 1));
            let finalGray = (levelIndex / (levels - 1)) * 255;

            if (thresholdInvert) {
              finalGray = 255 - finalGray;
            }

            let r = finalGray;
            let g = finalGray;
            let b = finalGray;

            if (thresholdColorMode === 'Mono') {
              const ratio = finalGray / 255;
              r = bgCol.r + (fgCol.r - bgCol.r) * ratio;
              g = bgCol.g + (fgCol.g - bgCol.g) * ratio;
              b = bgCol.b + (fgCol.b - bgCol.b) * ratio;
            } else if (thresholdColorMode === 'Original') {
              const ratio = finalGray / 255;
              r = origR * ratio;
              g = origG * ratio;
              b = origB * ratio;
            } else if (thresholdColorMode === 'Palette') {
              const col = getClosestPaletteColor(finalGray);
              r = col.r;
              g = col.g;
              b = col.b;
            }

            out[pIdx] = Math.max(0, Math.min(255, Math.round(r)));
            out[pIdx+1] = Math.max(0, Math.min(255, Math.round(g)));
            out[pIdx+2] = Math.max(0, Math.min(255, Math.round(b)));
            out[pIdx+3] = 255;
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'edge-detection') {
        const outDataArray = applyEdgeDetectionPipeline(width, height, rBuffer, gBuffer, bBuffer, {
          edgeAlgorithm,
          edgeThreshold,
          edgeLineWidth,
          edgeInvert,
          edgeBrightness,
          edgeContrast,
          edgeColorMode,
          edgeColor,
          edgeBgColor
        }, getClosestPaletteColor);

        const outData = outCtx.createImageData(width, height);
        outData.data.set(outDataArray);
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'crosshatch') {
        const layers = Math.min(5, Math.max(1, crosshatchLayers));
        const spacing = Math.max(3, 100 / crosshatchDensity);
        const baseAngleDeg = crosshatchAngle;
        const contrastFactor = (259 * (crosshatchContrast + 255)) / (255 * (259 - crosshatchContrast));

        // Fill canvas with background first
        outCtx.fillStyle = crosshatchBgColor;
        outCtx.fillRect(0, 0, width, height);

        // Set up stroke properties
        outCtx.strokeStyle = crosshatchLineColor;
        outCtx.lineWidth = crosshatchLineWidth;
        outCtx.lineCap = 'round';

        const thresholds = [0.8, 0.6, 0.4, 0.25, 0.12];

        for (let i = 0; i < layers; i++) {
          let angleDeg = baseAngleDeg;
          if (i === 1) angleDeg += 90;
          else if (i === 2) angleDeg += 45;
          else if (i === 3) angleDeg -= 45;
          else if (i === 4) angleDeg += 30;

          let angleRad = (angleDeg * Math.PI) / 180;
          angleRad += 0.0001; // Avoid exact 0, 90, 180 degree issues

          const S = Math.sin(angleRad);
          const C = Math.cos(angleRad);

          // Project corners to find offset range
          const proj0 = 0;
          const proj1 = -width * S;
          const proj2 = height * C;
          const proj3 = -width * S + height * C;

          const minProj = Math.min(proj0, proj1, proj2, proj3);
          const maxProj = Math.max(proj0, proj1, proj2, proj3);

          for (let offset = minProj; offset <= maxProj; offset += spacing) {
            const pts: {x: number, y: number}[] = [];
            if (Math.abs(C) > 0.0001) {
              const y1 = offset / C;
              if (y1 >= 0 && y1 <= height) pts.push({ x: 0, y: y1 });
              const y2 = (offset + width * S) / C;
              if (y2 >= 0 && y2 <= height) pts.push({ x: width, y: y2 });
            }
            if (Math.abs(S) > 0.0001) {
              const x1 = -offset / S;
              if (x1 >= 0 && x1 <= width) pts.push({ x: x1, y: 0 });
              const x2 = (height * C - offset) / S;
              if (x2 >= 0 && x2 <= width) pts.push({ x: x2, y: height });
            }

            // Filter duplicates
            const uniquePts: {x: number, y: number}[] = [];
            for (const p of pts) {
              if (!uniquePts.some(up => Math.hypot(up.x - p.x, up.y - p.y) < 0.1)) {
                uniquePts.push(p);
              }
            }

            if (uniquePts.length === 2) {
              const P_start = uniquePts[0];
              const P_end = uniquePts[1];

              const dx = P_end.x - P_start.x;
              const dy = P_end.y - P_start.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len < 1) continue;

              const stepSize = 3;
              const numSteps = Math.ceil(len / stepSize);

              outCtx.beginPath();
              let drawing = false;

              for (let k = 0; k < numSteps; k++) {
                const t = k / numSteps;
                let px = P_start.x + dx * t;
                let py = P_start.y + dy * t;

                // Add jitter/randomness if needed
                if (crosshatchRandomness > 0) {
                  const nx = -dy / len;
                  const ny = dx / len;
                  const jitter = (Math.random() - 0.5) * crosshatchRandomness * spacing * 0.4;
                  px += nx * jitter;
                  py += ny * jitter;
                }

                const sX = Math.max(0, Math.min(width - 1, Math.round(px)));
                const sY = Math.max(0, Math.min(height - 1, Math.round(py)));
                const sIdx = sY * width + sX;

                let pr = rBuffer[sIdx] + crosshatchBrightness;
                let pg = gBuffer[sIdx] + crosshatchBrightness;
                let pb = bBuffer[sIdx] + crosshatchBrightness;

                pr = (pr - 128) * contrastFactor + 128;
                pg = (pg - 128) * contrastFactor + 128;
                pb = (pb - 128) * contrastFactor + 128;

                let gray = 0.299 * pr + 0.587 * pg + 0.114 * pb;
                gray = Math.max(0, Math.min(255, gray));

                if (crosshatchInvert) {
                  gray = 255 - gray;
                }

                const normGray = gray / 255;
                const thresh = thresholds[i % 5];

                let shouldDraw = normGray < thresh;
                if (crosshatchRandomness > 0 && Math.random() < crosshatchRandomness * 0.15) {
                  shouldDraw = false;
                }

                if (shouldDraw) {
                  if (!drawing) {
                    outCtx.moveTo(px, py);
                    drawing = true;
                  } else {
                    outCtx.lineTo(px, py);
                  }
                } else {
                  if (drawing) {
                    outCtx.stroke();
                    outCtx.beginPath();
                    drawing = false;
                  }
                }
              }
              if (drawing) {
                outCtx.stroke();
              }
            }
          }
        }
      } else if (activeEffect === 'wave-lines') {
        applyWaveLinesPipeline(width, height, rBuffer, gBuffer, bBuffer, outCtx, {
          waveLineCount,
          waveAmplitude,
          waveFrequency,
          waveLineThickness,
          waveDirection,
          waveAnimate,
          waveBrightness,
          waveContrast,
          waveColorMode,
          waveLineColor,
          waveBgColor
        }, getClosestPaletteColor);
      } else if (activeEffect === 'noise-field') {
        // --- Noise Field Effect ---
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const timeOffset = noiseAnimate ? (Date.now() / 1000) * 0.5 * noiseSpeed : 0;
        const scaleVal = noiseScale > 0 ? noiseScale : 50;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;

            // Generate noise value in range [-1, 1]
            const nx = x / scaleVal;
            const ny = y / scaleVal;
            const noiseVal = getNoiseValue(nx, ny, timeOffset, noiseType, noiseOctaves);

            let targetX = x;
            let targetY = y;

            if (noiseDistortOnly) {
              // Displacement vectors based on noise
              const angle = (noiseVal + 1.0) * Math.PI; // Map [-1,1] to [0, 2PI]
              const displacement = noiseIntensity * 25; // Displacement up to 25px
              const dx = Math.cos(angle) * displacement;
              const dy = Math.sin(angle) * displacement;

              targetX = Math.max(0, Math.min(width - 1, Math.round(x + dx)));
              targetY = Math.max(0, Math.min(height - 1, Math.round(y + dy)));

              const sampleIdx = targetY * width + targetX;

              let r = rBuffer[sampleIdx] + noiseBrightness;
              let g = gBuffer[sampleIdx] + noiseBrightness;
              let b = bBuffer[sampleIdx] + noiseBrightness;

              const nContrastFactor = (259 * (noiseContrast + 255)) / (255 * (259 - noiseContrast));
              r = (r - 128) * nContrastFactor + 128;
              g = (g - 128) * nContrastFactor + 128;
              b = (b - 128) * nContrastFactor + 128;

              r = Math.max(0, Math.min(255, r));
              g = Math.max(0, Math.min(255, g));
              b = Math.max(0, Math.min(255, b));

              const outIdx = idx * 4;
              out[outIdx] = r;
              out[outIdx+1] = g;
              out[outIdx+2] = b;
              out[outIdx+3] = 255;
            } else {
              // Blend original image color with noise color
              let origR = rBuffer[idx];
              let origG = gBuffer[idx];
              let origB = bBuffer[idx];

              // Add noise flavor
              let r = origR + noiseBrightness + (noiseVal * noiseIntensity * 50);
              let g = origG + noiseBrightness + (noiseVal * noiseIntensity * 50);
              let b = origB + noiseBrightness + (noiseVal * noiseIntensity * 50);

              const nContrastFactor = (259 * (noiseContrast + 255)) / (255 * (259 - noiseContrast));
              r = (r - 128) * nContrastFactor + 128;
              g = (g - 128) * nContrastFactor + 128;
              b = (b - 128) * nContrastFactor + 128;

              r = Math.max(0, Math.min(255, r));
              g = Math.max(0, Math.min(255, g));
              b = Math.max(0, Math.min(255, b));

              const outIdx = idx * 4;
              out[outIdx] = r;
              out[outIdx+1] = g;
              out[outIdx+2] = b;
              out[outIdx+3] = 255;
            }
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'dots') {
        // Digital Dot-Screen Screen Shader
        outCtx.fillStyle = background;
        outCtx.fillRect(0, 0, width, height);

        const spacing = Math.max(4, dotsSpacing);
        const maxRadius = (spacing / 2) * dotsSize;

        for (let y = 0; y < height + spacing; y += spacing) {
          for (let x = 0; x < width + spacing; x += spacing) {
            let drawX = x;
            if (dotsGridType === 'Isometric Grid' && (Math.floor(y / spacing) % 2 === 1)) {
              drawX += spacing / 2;
            }

            const sampleX = Math.min(width - 1, Math.max(0, Math.floor(drawX)));
            const sampleY = Math.min(height - 1, Math.max(0, Math.floor(y)));
            const idx = sampleY * width + sampleX;

            let r = rBuffer[idx];
            let g = gBuffer[idx];
            let b = bBuffer[idx];

            r += dotsBrightness;
            g += dotsBrightness;
            b += dotsBrightness;

            const dContrastFactor = (259 * (dotsContrast + 255)) / (255 * (259 - dotsContrast));
            r = (r - 128) * dContrastFactor + 128;
            g = (g - 128) * dContrastFactor + 128;
            b = (b - 128) * dContrastFactor + 128;

            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));

            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const intensityVal = dotsInvert ? gray / 255 : (255 - gray) / 255;
            const radius = maxRadius * intensityVal;

            if (radius > 0.1) {
              let dotColor = foreground;
              if (dotsColorMode === 'Original') {
                dotColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
              } else if (dotsColorMode === 'Palette') {
                const col = getClosestPaletteColor(gray);
                dotColor = `rgb(${col.r}, ${col.g}, ${col.b})`;
              }

              outCtx.fillStyle = dotColor;
              outCtx.beginPath();
              if (dotsShape === 'Square') {
                outCtx.rect(drawX - radius, y - radius, radius * 2, radius * 2);
              } else if (dotsShape === 'Hexagon') {
                outCtx.moveTo(drawX + radius, y);
                for (let side = 1; side <= 6; side++) {
                  const angle = (side * Math.PI) / 3;
                  outCtx.lineTo(drawX + radius * Math.cos(angle), y + radius * Math.sin(angle));
                }
              } else {
                outCtx.arc(drawX, y, radius, 0, Math.PI * 2);
              }
              outCtx.fill();
            }
          }
        }
      } else if (activeEffect === 'contour') {
        // Contour Map Shader
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;
        const levelStep = 256 / Math.max(2, contourLevels);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const outIdx = idx * 4;

            let r = rBuffer[idx];
            let g = gBuffer[idx];
            let b = bBuffer[idx];

            r += contourBrightness;
            g += contourBrightness;
            b += contourBrightness;

            const cContrastFactor = (259 * (contourContrast + 255)) / (255 * (259 - contourContrast));
            r = (r - 128) * cContrastFactor + 128;
            g = (g - 128) * cContrastFactor + 128;
            b = (b - 128) * cContrastFactor + 128;

            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));

            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const currentLevel = Math.floor(gray / levelStep);

            let isBoundary = false;
            if (x < width - 1) {
              const rightIdx = y * width + (x + 1);
              const rightGray = 0.299 * rBuffer[rightIdx] + 0.587 * gBuffer[rightIdx] + 0.114 * bBuffer[rightIdx];
              const rightLevel = Math.floor((rightGray + contourBrightness) / levelStep);
              if (rightLevel !== currentLevel) isBoundary = true;
            }
            if (y < height - 1) {
              const downIdx = (y + 1) * width + x;
              const downGray = 0.299 * rBuffer[downIdx] + 0.587 * gBuffer[downIdx] + 0.114 * bBuffer[downIdx];
              const downLevel = Math.floor((downGray + contourBrightness) / levelStep);
              if (downLevel !== currentLevel) isBoundary = true;
            }

            const levelCenterGray = (currentLevel + 0.5) * levelStep;
            let baseR = levelCenterGray;
            let baseG = levelCenterGray;
            let baseB = levelCenterGray;

            if (contourColorMode === 'Original') {
              const grayRatio = levelCenterGray / Math.max(1, gray);
              baseR = r * grayRatio;
              baseG = g * grayRatio;
              baseB = b * grayRatio;
            } else if (contourColorMode === 'Palette') {
              const col = getClosestPaletteColor(levelCenterGray);
              baseR = col.r;
              baseG = col.g;
              baseB = col.b;
            } else {
              const colorVal = currentLevel * levelStep;
              baseR = fgColor.r * (colorVal / 255) + bgColor.r * (1 - colorVal / 255);
              baseG = fgColor.g * (colorVal / 255) + bgColor.g * (1 - colorVal / 255);
              baseB = fgColor.b * (colorVal / 255) + bgColor.b * (1 - colorVal / 255);
            }

            let finalR = baseR;
            let finalG = baseG;
            let finalB = baseB;

            if (contourFillMode === 'Lines Only') {
              if (isBoundary) {
                if (contourColorMode === 'Mono') {
                  finalR = fgColor.r; finalG = fgColor.g; finalB = fgColor.b;
                } else if (contourColorMode === 'Palette') {
                  const col = getClosestPaletteColor(gray);
                  finalR = col.r; finalG = col.g; finalB = col.b;
                } else {
                  finalR = r; finalG = g; finalB = b;
                }
              } else {
                finalR = bgColor.r; finalG = bgColor.g; finalB = bgColor.b;
              }
            } else if (contourFillMode === 'Filled Lines') {
              if (isBoundary) {
                finalR = contourInvert ? 255 - fgColor.r : fgColor.r;
                finalG = contourInvert ? 255 - fgColor.g : fgColor.g;
                finalB = contourInvert ? 255 - fgColor.b : fgColor.b;
              }
            }

            out[outIdx] = Math.min(255, Math.max(0, finalR));
            out[outIdx+1] = Math.min(255, Math.max(0, finalG));
            out[outIdx+2] = Math.min(255, Math.max(0, finalB));
            out[outIdx+3] = 255;
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'pixel-sort') {
        applyPixelSortPipeline(width, height, rBuffer, gBuffer, bBuffer, outCtx, {
          sortDirection,
          sortMode,
          sortThreshold,
          sortStreakLength,
          sortIntensity,
          sortRandomness,
          sortReverse,
          sortBrightness,
          sortContrast
        });
      } else if (activeEffect === 'voronoi') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const cellSize = Math.max(5, voronoiCellSize);
        const randomize = voronoiRandomize;
        const edgeWidth = voronoiEdgeWidth;

        // Parse edge color
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 0, g: 0, b: 0 };
        };
        const edgeRGB = hexToRgb(voronoiEdgeColor);

        // Deterministic cell seed helper
        const getCellSeed = (c: number, r: number, size: number, rand: number) => {
          const h1 = Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453123) % 1;
          const h2 = Math.abs(Math.cos(c * 37.719 + r * 49.567) * 43758.5453123) % 1;
          const centerX = c * size + size / 2;
          const centerY = r * size + size / 2;
          const jitterX = (h1 - 0.5) * size * rand;
          const jitterY = (h2 - 0.5) * size * rand;
          return {
            x: Math.max(0, Math.min(width - 1, centerX + jitterX)),
            y: Math.max(0, Math.min(height - 1, centerY + jitterY))
          };
        };

        // Pre-calculate cell average colors if mode is 'Cell Average'
        const cellAverages: { [key: string]: { r: number, g: number, b: number, count: number } } = {};
        if (voronoiColorMode === 'Cell Average') {
          const step = cellSize < 10 ? 1 : 2;
          for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
              const cellX = Math.floor(x / cellSize);
              const cellY = Math.floor(y / cellSize);

              let minDist = Infinity;
              let closestKey = "";

              for (let dc = -2; dc <= 2; dc++) {
                for (let dr = -2; dr <= 2; dr++) {
                  const c = cellX + dc;
                  const r = cellY + dr;
                  const seed = getCellSeed(c, r, cellSize, randomize);
                  const dx = x - seed.x;
                  const dy = y - seed.y;
                  const dist = dx * dx + dy * dy;
                  if (dist < minDist) {
                    minDist = dist;
                    closestKey = `${c},${r}`;
                  }
                }
              }

              const idx = y * width + x;
              if (!cellAverages[closestKey]) {
                cellAverages[closestKey] = { r: 0, g: 0, b: 0, count: 0 };
              }
              cellAverages[closestKey].r += rBuffer[idx];
              cellAverages[closestKey].g += gBuffer[idx];
              cellAverages[closestKey].b += bBuffer[idx];
              cellAverages[closestKey].count++;
            }
          }
        }

        const contrastFactor = (259 * (voronoiContrast + 255)) / (255 * (259 - voronoiContrast));

        // Main pixel pass
        for (let y = 0; y < height; y++) {
          const cellY = Math.floor(y / cellSize);

          for (let x = 0; x < width; x++) {
            const cellX = Math.floor(x / cellSize);

            let minDist = Infinity;
            let secondMinDist = Infinity;
            let closestC = 0;
            let closestR = 0;
            let closestSeedX = 0;
            let closestSeedY = 0;

            for (let dc = -2; dc <= 2; dc++) {
              for (let dr = -2; dr <= 2; dr++) {
                const c = cellX + dc;
                const r = cellY + dr;
                const seed = getCellSeed(c, r, cellSize, randomize);
                const dx = x - seed.x;
                const dy = y - seed.y;
                const dist = dx * dx + dy * dy;

                if (dist < minDist) {
                  secondMinDist = minDist;
                  minDist = dist;
                  closestC = c;
                  closestR = r;
                  closestSeedX = seed.x;
                  closestSeedY = seed.y;
                } else if (dist < secondMinDist) {
                  secondMinDist = dist;
                }
              }
            }

            const d1 = Math.sqrt(minDist);
            const d2 = Math.sqrt(secondMinDist);
            const edgeDist = d2 - d1;

            const idx = y * width + x;
            const outIdx = idx * 4;

            if (edgeWidth > 0 && edgeDist < edgeWidth) {
              out[outIdx] = edgeRGB.r;
              out[outIdx + 1] = edgeRGB.g;
              out[outIdx + 2] = edgeRGB.b;
              out[outIdx + 3] = 255;
            } else {
              let cellR = 0, cellG = 0, cellB = 0;

              if (voronoiColorMode === 'Center Sample') {
                const sIdx = Math.round(closestSeedY) * width + Math.round(closestSeedX);
                cellR = rBuffer[sIdx];
                cellG = gBuffer[sIdx];
                cellB = bBuffer[sIdx];
              } else if (voronoiColorMode === 'Cell Average') {
                const key = `${closestC},${closestR}`;
                const avg = cellAverages[key];
                if (avg && avg.count > 0) {
                  cellR = avg.r / avg.count;
                  cellG = avg.g / avg.count;
                  cellB = avg.b / avg.count;
                } else {
                  const sIdx = Math.round(closestSeedY) * width + Math.round(closestSeedX);
                  cellR = rBuffer[sIdx];
                  cellG = gBuffer[sIdx];
                  cellB = bBuffer[sIdx];
                }
              } else { // 'Gradient'
                const sIdx = Math.round(closestSeedY) * width + Math.round(closestSeedX);
                const sR = rBuffer[sIdx];
                const sG = gBuffer[sIdx];
                const sB = bBuffer[sIdx];

                const t = Math.min(1.0, d1 / (cellSize * 1.5));
                cellR = sR * (1 - t) + rBuffer[idx] * t;
                cellG = sG * (1 - t) + gBuffer[idx] * t;
                cellB = sB * (1 - t) + bBuffer[idx] * t;
              }

              // Adjustments: Brightness
              cellR += voronoiBrightness;
              cellG += voronoiBrightness;
              cellB += voronoiBrightness;

              // Adjustments: Contrast
              cellR = (cellR - 128) * contrastFactor + 128;
              cellG = (cellG - 128) * contrastFactor + 128;
              cellB = (cellB - 128) * contrastFactor + 128;

              out[outIdx] = Math.max(0, Math.min(255, cellR));
              out[outIdx + 1] = Math.max(0, Math.min(255, cellG));
              out[outIdx + 2] = Math.max(0, Math.min(255, cellB));
              out[outIdx + 3] = 255;
            }
          }
        }

        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'vhs') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const rowOffsets = new Float32Array(height);
        const trackingStart = height * 0.85 - (vhsTrackingError * 80);
        const trackingEnd = height * 0.85 + 20;

        for (let y = 0; y < height; y++) {
          let shift = Math.sin(y / 10) * vhsDistortion * 5;
          shift += Math.sin(y / 1.5) * vhsDistortion * 1.5;

          if (y >= trackingStart && y <= trackingEnd) {
            const tFactor = (y - trackingStart) / (trackingEnd - trackingStart);
            shift += Math.sin(y / 3) * vhsTrackingError * 30 * tFactor;
          }

          rowOffsets[y] = shift;
        }

        const contrastFactor = (259 * (vhsContrast + 255)) / (255 * (259 - vhsContrast));

        for (let y = 0; y < height; y++) {
          const shiftX = rowOffsets[y];
          const isTrackingBand = y >= trackingStart && y <= trackingEnd;
          const scanlineVal = 1 - (vhsScanlines * 0.35 * (y % 3 === 0 ? 1 : 0));

          for (let x = 0; x < width; x++) {
            const idx = y * width + x;

            const rX = Math.max(0, Math.min(width - 1, Math.round(x + shiftX - vhsColorBleed * 7)));
            const gX = Math.max(0, Math.min(width - 1, Math.round(x + shiftX)));
            const bX = Math.max(0, Math.min(width - 1, Math.round(x + shiftX + vhsColorBleed * 7)));

            const rIdx = y * width + rX;
            const gIdx = y * width + gX;
            const bIdx = y * width + bX;

            let r = rBuffer[rIdx];
            let g = gBuffer[gIdx];
            let b = bBuffer[bIdx];

            if (vhsNoise > 0) {
              const noiseVal = (Math.random() - 0.5) * vhsNoise * 90;
              r += noiseVal;
              g += noiseVal;
              b += noiseVal;
            }

            if (isTrackingBand && Math.random() < vhsTrackingError * 0.5) {
              const staticNoise = Math.random() < 0.5 ? 255 : 0;
              r = staticNoise;
              g = staticNoise;
              b = staticNoise;
            }

            r += vhsBrightness;
            g += vhsBrightness;
            b += vhsBrightness;

            r = (r - 128) * contrastFactor + 128;
            g = (g - 128) * contrastFactor + 128;
            b = (b - 128) * contrastFactor + 128;

            r *= scanlineVal;
            g *= scanlineVal;
            b *= scanlineVal;

            const outIdx = idx * 4;
            out[outIdx] = Math.max(0, Math.min(255, r));
            out[outIdx + 1] = Math.max(0, Math.min(255, g));
            out[outIdx + 2] = Math.max(0, Math.min(255, b));
            out[outIdx + 3] = 255;
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'matrix-rain') {
        const { charGrid } = renderMatrixRain(
          outCtx,
          srcCanvas,
          width,
          height,
          matrixSettings,
          matrixFrameCountRef.current
        );
        matrixCharGridRef.current = charGrid;
      }

    // Stop processing spinner
    setIsProcessing(false);
  }