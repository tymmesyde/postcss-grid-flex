/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = () => {
  return {
    postcssPlugin: 'postcss-grid-flex',
    Declaration (decl, { Rule, Declaration }) {
      if (decl.prop === 'justify-content' && decl.value === 'space-evenly') {
        decl.assign({ prop: 'justify-content', value: 'space-between' });

        const ruleDeclarations = [
          new Declaration({ prop: 'content', value: '""' }),
          new Declaration({ prop: 'display', value: 'block' })
        ];

        const selectors = ['before', 'after'];

        selectors.forEach(selector => {
          const rule = new Rule({
            selector: `${decl.parent.selector}:${selector}`
          });

          ruleDeclarations.forEach(declaration => rule.push(declaration));
          decl.parent.after(rule);
        });
      }

      if (decl.prop === 'grid-template-columns') {
        const match = /repeat\((\d+),\s*1fr\)/.exec(decl.value);

        if (match != null) {
          const rule = decl.parent;
          const itemCount = match[1];

          rule.push(new Declaration({ prop: 'display', value: 'flex' }));
          rule.push(new Declaration({ prop: 'flex-wrap', value: 'wrap' }));

          const allChildrenRule = new Rule({
            selector: `${decl.parent.selector} > *`
          });

          allChildrenRule.push(new Declaration({ prop: 'flex', value: `1 0 ${100 / itemCount}%` }));

          rule.after(allChildrenRule);
        }
      }

      if (decl.prop === 'grid-gap') {
        const unitsMatch = /([+-]?([0-9]*[.])?[0-9]+)(\w{2,3})/.exec(decl.value);

        if (unitsMatch != null) {
          const rule = decl.parent;
          const margin = `${unitsMatch[1] * 2}${unitsMatch[3]}`;

          rule.push(new Declaration({ prop: 'margin-left', value: `-${margin}` }));

          const allChildrenRule = new Rule({
            selector: `${decl.parent.selector} > *`
          });

          allChildrenRule.push(new Declaration({ prop: 'margin-left', value: margin }));
          allChildrenRule.push(new Declaration({ prop: 'margin-bottom', value: margin }));

          rule.after(allChildrenRule);
        }
      }

      if (decl.prop === 'gap') {
        const unitsMatch = /([+-]?([0-9]*[.])?[0-9]+)(\w{2,3})/.exec(decl.value);

        if (unitsMatch != null) {
          const rule = decl.parent;
          const gapAmount = unitsMatch[1];
          const gapUnit = unitsMatch[3];
          const marginValue = `${gapAmount / 2}${gapUnit}`;

          const childrenRule = rule.root().nodes.find(({ type, selector }) => type === 'rule' && selector.startsWith(`${rule.selector} `));

          if (childrenRule) {
            const declarations = childrenRule.nodes.filter(({ type, prop }) => type === 'decl' && (prop === 'height' || prop === 'width'));

            declarations.forEach(declaration => {
              const unitsMatch = /([+-]?([0-9]*[.])?[0-9]+)(\w{2,3})/.exec(declaration.value);
              if (!unitsMatch) return declaration.value = `calc(${declaration.value} - ${gapAmount}${gapUnit})`;
              if (unitsMatch[1] > gapAmount) declaration.value = `calc(${unitsMatch[0]} - ${gapAmount}${gapUnit})`;
            });
          }

          const flexDirectionDeclaration = rule.nodes.find(({ type, prop }) => type === 'decl' && prop === 'flex-direction');

          if (flexDirectionDeclaration) {
            const direction = flexDirectionDeclaration.value;

            const lastChildRule = new Rule({
              selector: `${decl.parent.selector} > :last-child`
            });
            const firstChildRule = new Rule({
              selector: `${decl.parent.selector} > :first-child`
            });
            const allChildrenRule = new Rule({
              selector: `${decl.parent.selector} > *`
            });

            if (direction === 'column') {
              lastChildRule.push(new Declaration({ prop: 'margin-bottom', value: 0 }));
              firstChildRule.push(new Declaration({ prop: 'margin-top', value: 0 }));
              allChildrenRule.push(new Declaration({ prop: 'margin', value: `${marginValue} 0 ${marginValue} 0` }));
            }

            else if (direction === 'row') {
              lastChildRule.push(new Declaration({ prop: 'margin-right', value: 0 }));
              firstChildRule.push(new Declaration({ prop: 'margin-left', value: 0 }));
              allChildrenRule.push(new Declaration({ prop: 'margin', value: `0 ${marginValue} 0 ${marginValue}` }));
            }

            rule.after(lastChildRule);
            rule.after(firstChildRule);
            rule.after(allChildrenRule);
          } else {
            const allChildrenRule = new Rule({
              selector: `${decl.parent.selector} > *`
            });

            allChildrenRule.push(new Declaration({ prop: 'margin', value: marginValue }));
            rule.after(allChildrenRule);
          }

          decl.remove();
        }
      }

      if (decl.prop === 'aspect-ratio') {
        const parentRule = decl.parent;
        const parentRuleHeightDeclaration = parentRule.nodes.find(({ type, prop }) => type === 'decl' && prop === 'height');

        if (parentRuleHeightDeclaration) {
          parentRule.push(new Declaration({ prop: 'width', value: `calc(${parentRuleHeightDeclaration.value.replace('calc', '')} * (${decl.value}))` }));
          decl.remove();
        } else {
          const splittedSelector = parentRule.selector.split('.');
          const parentRuleSelector = splittedSelector.splice(0, splittedSelector.length - 1).join('.');
          const sameSelectorRules = parentRule.root().nodes.filter(({ type, selector }) => type === 'rule' && selector === parentRuleSelector);

          if (sameSelectorRules.length) {
            sameSelectorRules.forEach(rule => {
              const declarations = rule.nodes.filter(({ type, prop }) => type === 'decl' && prop === 'height');

              declarations.forEach(declaration => {
                parentRule.push(new Declaration({ prop: 'width', value: `calc(${declaration.value.replace('calc', '')} * (${decl.value}))` }));
                decl.remove();
              });
            })
          }
        }
      }
    }
  }
}

module.exports.postcss = true
