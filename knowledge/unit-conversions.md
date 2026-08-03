# Unit Conversion Reference

**Priority 5 source.** Calculation reference for the **App Rate (lb ai/A)** column.

Conversions are arithmetic, not label facts. Use this chart to *transform* a rate the label
states — never to *invent* one the label omits.

## Volume

| From | To | Multiply by |
|---|---|---|
| fluid ounces (fl oz) | gallons | ÷ 128 |
| pints (pt) | fluid ounces | × 16 |
| quarts (qt) | fluid ounces | × 32 |
| gallons (gal) | fluid ounces | × 128 |
| pints | gallons | ÷ 8 |
| quarts | gallons | ÷ 4 |
| millilitres (mL) | fluid ounces | ÷ 29.5735 |
| litres (L) | gallons | ÷ 3.78541 |

## Weight

| From | To | Multiply by |
|---|---|---|
| ounces (oz) | pounds | ÷ 16 |
| pounds (lb) | ounces | × 16 |
| grams (g) | pounds | ÷ 453.592 |
| kilograms (kg) | pounds | × 2.20462 |

## Area

| From | To | Multiply by |
|---|---|---|
| acres (A) | square feet | × 43,560 |
| hectares (ha) | acres | × 2.47105 |
| acres | hectares | ÷ 2.47105 |
| 1,000 sq ft | acres | ÷ 43.56 |

## Time

| From | To | Multiply by |
|---|---|---|
| days | hours | × 24 |
| hours | days | ÷ 24 |

Used only to detect PHI/REI unit swaps. **Never convert** a stated PHI or REI — record it in
the label's own unit (PHI in days, REI in hours) and flag the mismatch instead.

## Calculating lb ai/A

The **App Rate (lb ai/A)** column needs the product's active-ingredient concentration, which
appears on the label's front panel or ingredient statement.

### Liquid products (ai given as lb ai per gallon)

```
lb ai/A = (rate in gal/A) × (lb ai per gal)
```

**Worked example** — label states `24 fl oz/A`, product is `4 lb ai/gal`:

```
24 fl oz ÷ 128      = 0.1875 gal/A
0.1875 × 4 lb ai/gal = 0.75 lb ai/A
```

### Dry products (ai given as a percentage by weight)

```
lb ai/A = (rate in lb/A) × (percent ai ÷ 100)
```

**Worked example** — label states `2.5 lb/A`, product is `50% ai`:

```
2.5 × 0.50 = 1.25 lb ai/A
```

### Ranges

Convert both ends and keep the range:

```
1.5–3.0 fl oz/A at 4 lb ai/gal  →  0.047–0.094 lb ai/A
```

## Rules

1. **Round to three decimal places**, or to the label's precision if coarser.
2. **Never estimate a concentration.** If the label does not state ai per gallon or percent
   ai, the cell is `NS`.
3. **Never convert across product forms.** Volume-to-weight requires density, which labels
   rarely state.
4. **Show the working** in a QC report so the arithmetic can be rechecked.
5. **Web search is permitted here** — for a conversion *factor* only. Never search for a
   product's rate, concentration, PHI, or REI.
