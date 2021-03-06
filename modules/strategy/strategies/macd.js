'use strict';

module.exports = class MACD {
    getName() {
        return 'macd'
    }

    buildIndicator(indicatorBuilder, options) {
        if (!options['period']) {
            throw 'Invalid period'
        }

        indicatorBuilder.add('macd', 'macd', options['period'])

        indicatorBuilder.add('sma200', 'sma', options['period'], {
            'length': 200,
        })

        indicatorBuilder.add('ema200', 'ema', options['period'], {
            'length': 200,
        })
    }

    period(indicatorPeriod) {
        return this.macd(
            indicatorPeriod.getPrice(),
            indicatorPeriod.getIndicator('sma200'),
            indicatorPeriod.getIndicator('ema200'),
            indicatorPeriod.getIndicator('macd'),
            indicatorPeriod.getLastSignal(),
        )
    }

    macd(price, sma200Full, ema200Full, macdFull, lastSignal) {
        return new Promise(async (resolve) => {
            if (macdFull.length < 2 || sma200Full.length < 2 || ema200Full.length < 2) {
                resolve()
                return
            }

            // remove incomplete candle
            let sma200 = sma200Full.slice(0, -1)
            let ema200 = ema200Full.slice(0, -1)
            let macd = macdFull.slice(0, -1)

            let debug = {
                'sma200': sma200.slice(-1)[0],
                'ema200': ema200.slice(-1)[0],
                'histogram': macd.slice(-1)[0].histogram,
                'last_signal': lastSignal,
            }

            let before = macd.slice(-2)[0].histogram
            let last = macd.slice(-1)[0].histogram

            // trend change
            if (
                (lastSignal === 'long' && before > 0 && last < 0)
                || (lastSignal === 'short' && before < 0 && last > 0)
            ) {
                resolve({
                    'signal': 'close',
                    'debug': debug,
                })

                return
            }

            // sma long
            let long = price >= sma200.slice(-1)[0]

            // ema long
            if (!long) {
                long = price >= ema200.slice(-1)[0]
            }

            if (long) {
                // long
                if(before < 0 && last > 0) {
                    resolve({
                        'signal': 'long',
                        'debug': debug,
                    })
                }
            } else {
                // short

                if(before > 0 && last < 0) {
                    resolve({
                        'signal': 'short',
                        'debug': debug
                    })
                }
            }

            resolve({'debug': debug})
        })
    }

    getOptions() {
        return {
            'period': '15m',
        }
    }
}
