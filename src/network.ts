import * as tf from '@tensorflow/tfjs';
import { Direction, Movement } from './movemet';

export class Network {
    Model: tf.Sequential;

    constructor() {
        this.Model = tf.sequential();

        const hidden = tf.layers.dense({
            units: 8,
            inputShape: [8],
            activation: "relu"
        });
        this.Model.add(hidden);

        const output = tf.layers.dense({
            units: 4,
            activation: "softmax"
        });
        this.Model.add(output);
        this.Model.summary();
        this.Model.compile({optimizer: "sgd", loss: "meanSquaredError"});
    }

    Predict(inputs: any[]) : Direction {
        var result = tf.tidy(() => {
            const xs = tf.tensor2d([inputs]);
            const ys = this.Model.predict(xs) as tf.Tensor<tf.Rank>;
            const outputs = ys.dataSync();
            console.log(outputs);
            return outputs;
        });

        let left = result[0];
        let up = result[1];
        let right = result[2];
        let down = result[3];

        if (left > up && left > right && left > down)
            return Direction.Left;
        if (up > left && up > right && up > down)
            return Direction.Up;
        if (right > up && right > left && right > down)
            return Direction.Right;
        if (down > up && down > right && down > left)
            return Direction.Down;
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

                        if (Math.random() > 0.5)
                            values[j] = w + 0.1;
                        else
                            values[j] = w - 0.1;
                    }
                }

                let newTensor = tf.tensor(values, shape);
                mutatedWeights[i] = newTensor;
            }
            this.Model.setWeights(mutatedWeights);
        })
    }

    GetWeights() {
        return this.Model.getWeights();
    }

    SetWeights(array) {
        return this.Model.setWeights(array);
    }
}