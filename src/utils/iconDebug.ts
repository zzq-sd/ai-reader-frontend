// Font Awesome 图标调试工具
export class IconDebugger {
  static checkFontAwesomeLoaded(): boolean {
    try {
      // 创建测试图标元素
      const testIcon = document.createElement('i')
      testIcon.className = 'fas fa-home'
      testIcon.style.cssText = 'position: absolute; left: -9999px; top: -9999px; visibility: hidden;'
      document.body.appendChild(testIcon)
      
      // 检查伪元素内容
      const styles = window.getComputedStyle(testIcon, ':before')
      const content = styles.content
      const fontFamily = styles.fontFamily
      
      // 清理测试元素
      document.body.removeChild(testIcon)
      
      // 如果有内容且字体族包含Font Awesome，说明已加载
      const hasContent = !!(content && content !== 'none' && content !== '""' && content !== "''")
      const hasFont = !!(fontFamily && fontFamily.toLowerCase().includes('font awesome'))
      
      console.log('Font Awesome Debug:', {
        content,
        fontFamily,
        hasContent,
        hasFont,
        loaded: hasContent || hasFont
      })
      
      return hasContent || hasFont
    } catch (error) {
      console.error('Error checking Font Awesome:', error)
      return false
    }
  }
  
  static listAvailableFonts(): string[] {
    try {
      // 获取所有已加载的字体
      if ('fonts' in document) {
        const loadedFonts: string[] = []
        // @ts-ignore
        document.fonts.forEach((font: FontFace) => {
          if (font.family.toLowerCase().includes('awesome')) {
            loadedFonts.push(font.family)
          }
        })
        return loadedFonts
      }
      return []
    } catch (error) {
      console.error('Error listing fonts:', error)
      return []
    }
  }
  
  static testIconRendering(iconClass: string): void {
    const testDiv = document.createElement('div')
    testDiv.innerHTML = `
      <div style="padding: 20px; background: white; border: 1px solid #ccc; margin: 10px;">
        <h3>图标测试: ${iconClass}</h3>
        <div style="font-size: 24px; margin: 10px 0;">
          <i class="${iconClass}" style="color: red;"></i> 当前
        </div>
        <div style="font-size: 24px; margin: 10px 0;">
          <i class="fas fa-home" style="color: green;"></i> 参考 (fa-home)
        </div>
        <div style="font-family: monospace; font-size: 12px;">
          类名: ${iconClass}
        </div>
      </div>
    `
    document.body.appendChild(testDiv)
    
    // 5秒后自动移除
    setTimeout(() => {
      if (testDiv.parentNode) {
        testDiv.parentNode.removeChild(testDiv)
      }
    }, 5000)
  }
  
  static checkCSSRules(): void {
    console.log('=== CSS Rules Debug ===')
    
    // 检查相关的CSS规则
    const styleSheets = Array.from(document.styleSheets)
    const fontAwesomeRules: CSSRule[] = []
    
    styleSheets.forEach((sheet, sheetIndex) => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || [])
        rules.forEach((rule, ruleIndex) => {
          if (rule.cssText && (
            rule.cssText.includes('font-awesome') ||
            rule.cssText.includes('.fa') ||
            rule.cssText.includes('@font-face')
          )) {
            fontAwesomeRules.push(rule)
            console.log(`Sheet ${sheetIndex}, Rule ${ruleIndex}:`, rule.cssText)
          }
        })
      } catch (e) {
        console.log(`Cannot access stylesheet ${sheetIndex}:`, e)
      }
    })
    
    console.log(`Found ${fontAwesomeRules.length} Font Awesome related CSS rules`)
  }
  
  static async waitForFontsLoaded(): Promise<boolean> {
    if ('fonts' in document) {
      try {
        // @ts-ignore
        await document.fonts.ready
        return this.checkFontAwesomeLoaded()
      } catch (error) {
        console.error('Error waiting for fonts:', error)
        return false
      }
    }
    
    // 降级处理：等待一段时间后检查
    await new Promise(resolve => setTimeout(resolve, 1000))
    return this.checkFontAwesomeLoaded()
  }
  
  static runFullDiagnostic(): void {
    console.log('=== Font Awesome 诊断开始 ===')
    
    // 基础检查
    const isLoaded = this.checkFontAwesomeLoaded()
    console.log('Font Awesome 加载状态:', isLoaded)
    
    // 字体列表
    const fonts = this.listAvailableFonts()
    console.log('已加载的 Font Awesome 字体:', fonts)
    
    // CSS规则检查
    this.checkCSSRules()
    
    // 网络请求检查
    if (window.performance && window.performance.getEntriesByType) {
      const resourceEntries = window.performance.getEntriesByType('resource')
      const fontEntries = resourceEntries.filter(entry => 
        entry.name.includes('font') || 
        entry.name.includes('awesome') ||
        entry.name.includes('.woff') ||
        entry.name.includes('.ttf')
      )
      console.log('字体资源加载情况:', fontEntries)
    }
    
    console.log('=== 诊断结束 ===')
  }
}

// 自动执行诊断（在开发环境）
if (import.meta.env.DEV) {
  // 页面加载完成后执行诊断
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => IconDebugger.runFullDiagnostic(), 1000)
    })
  } else {
    setTimeout(() => IconDebugger.runFullDiagnostic(), 1000)
  }
} 