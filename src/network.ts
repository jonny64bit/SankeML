import * as tf from '@tensorflow/tfjs';
import { Direction, MoveResult } from './snake';
export enum Turn { Forward, Left, Right }

export class Network {
    Model: tf.Sequential;

    constructor() {
        this.Model = tf.sequential({
            layers: [
                tf.layers.dense({ units: 24, inputShape: [4], activation: "relu"}),
                tf.layers.dense({ units: 12, inputShape: [24], activation: "softmax" }),
                tf.layers.dense({ units: 8, inputShape: [12], activation: "softmax" })
            ]
        });
        this.Model.compile({ optimizer: "sgd", loss: "meanSquaredError" });
    }

    Predict(inputs: any[]): Turn {
        var result = tf.tidy(() => {
            const xs = tf.tensor2d([inputs]);
            const ys = this.Model.predict(xs) as tf.Tensor<tf.Rank>;
            const outputs = ys.dataSync();
            //console.log(outputs);
            return outputs;
        });

        let left = result[0];
        let forward = result[1];
        let right = result[2];

        if (left > forward && left > right)
            return Turn.Left;
        if (forward > left && forward > right)
            return Turn.Forward;
        else
            return Turn.Right;
    }

    Copy(): Network {
        const newModel = new Network();
        const weights = this.Model.getWeights();
        const weightCopyies = [];
        for (let i = 0; i < weights.length; i++) {
            weightCopyies[i] = weights[i].clone();
        }
        newModel.Model.setWeights(weightCopyies);
        return newModel;
    }

    /*
    Mutate(rate) {
        tf.tidy(() => {
            const weights = this.Model.getWeights();
            const mutatedWeights = [];
            for (let i = 0; i < weights.length; i++) {
                let tensor = weights[i];
                let shape = weights[i].shape;
                let values = tensor.dataSync().slice();

                for (let j = 0; j < values.length; j++) {
                    if (Math.random() < rate) {
                        let w = values[j];

                        values[j] = w + this.randn_bm(-1, 1, 1);
                    }
                }

                let newTensor = tf.tensor(values, shape);
                mutatedWeights[i] = newTensor;
            }
            this.Model.setWeights(mutatedWeights);
        })
    }*/

    Mutate(rate = 0.01, mutateFunction = null) {
        tf.tidy(() => {
            const weights = this.Model.getWeights();
            const mutatedWeights = [];
            for (let i = 0; i < weights.length; i += 1) {
                const tensor = weights[i];
                const { shape } = weights[i];
                // TODO: Evaluate if this should be sync or not
                const values = tensor.dataSync().slice();
                for (let j = 0; j < values.length; j += 1) {
                    if (Math.random() < rate) {
                        if (mutateFunction) {
                            values[j] = mutateFunction(values[j]);
                        } else {
                            values[j] = Math.min(Math.max(values[j] + this.randomGaussian(), -1), 1);
                        }
                    }
                }
                const newTensor = tf.tensor(values, shape);
                mutatedWeights[i] = newTensor;
            }
            this.Model.setWeights(mutatedWeights);
        });
    }

    Crossover(other: Network) {
        return tf.tidy(() => {
            const weightsA = this.Model.getWeights();
            const weightsB = other.Model.getWeights();
            const childWeights = [];
            for (let i = 0; i < weightsA.length; i += 1) {
                const tensorA = weightsA[i];
                const tensorB = weightsB[i];
                const { shape } = weightsA[i];
                // TODO: Evaluate if this should be sync or not
                const valuesA = tensorA.dataSync().slice();
                const valuesB = tensorB.dataSync().slice();
                for (let j = 0; j < valuesA.length; j += 1) {
                    if (Math.random() < 0.5) {
                        valuesA[j] = valuesB[j];
                    }
                }
                const newTensor = tf.tensor(valuesA, shape);
                childWeights[i] = newTensor;
            }
            this.Model.setWeights(childWeights);
        });
    }


    GetWeights() {
        return this.Model.getWeights();
    }

    SetWeights(array) {
        return this.Model.setWeights(array);
    }

    randn_bm(min, max, skew) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        if (num > 1 || num < 0) num = this.randn_bm(min, max, skew); // resample between 0 and 1 if out of range
        num = Math.pow(num, skew); // Skew
        num *= max - min; // Stretch to fill range
        num += min; // offset to min
        return num;
    }

    randomFloat = (min = 0, max = 1) => (Math.random() * (max - min)) + min;

    randomGaussian = (mean = 0, sd = 1) => {
        let y1;
        let y2;
        let x1;
        let x2;
        let w;
        let previous;
        if (previous) {
            y1 = y2;
            previous = false;
        } else {
            do {
                x1 = this.randomFloat(0, 2) - 1;
                x2 = this.randomFloat(0, 2) - 1;
                w = (x1 * x1) + (x2 * x2);
            } while (w >= 1);
            w = Math.sqrt((-2 * Math.log(w)) / w);
            y1 = x1 * w;
            y2 = x2 * w;
            previous = true;
        }
        return (y1 * sd) + mean;
    };
}