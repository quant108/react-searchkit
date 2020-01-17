/*
 * This file is part of React-SearchKit.
 * Copyright (C) 2019 CERN.
 *
 * React-SearchKit is free software; you can redistribute it and/or modify it
 * under the terms of the MIT License; see LICENSE file for more details.
 */

import _get from 'lodash/get';
import _hasIn from 'lodash/hasIn';
import axios from 'axios';
import { ESRequestSerializer } from './ESRequestSerializer';
import { ESResponseSerializer } from './ESResponseSerializer';

export class ESSearchApi {
  constructor(config) {
    this.axiosConfig = _get(config, 'axios', {});
    this.validateAxiosConfig();
    this.initSerializers(config);
    this.initInterceptors(config);
    this.initAxios();
  }

  validateAxiosConfig() {
    if (!_hasIn(this.axiosConfig, 'url')) {
      throw new Error('ESSearchApi config: `node` field is required.');
    }
  }

  initInterceptors(config) {
    this.requestInterceptor = _get(config, 'interceptors.request', undefined);
    this.responseInterceptor = _get(config, 'interceptors.response', undefined);
  }

  initSerializers(config) {
    const requestSerializerCls = _get(
      config,
      'es.requestSerializer',
      ESRequestSerializer
    );
    const responseSerializerCls = _get(
      config,
      'es.responseSerializer',
      ESResponseSerializer
    );

    this.requestSerializer = new requestSerializerCls();
    this.responseSerializer = new responseSerializerCls();
  }

  initAxios() {
    this.http = axios.create(this.axiosConfig);
    this.addInterceptors();
  }

  addInterceptors() {
    if (this.requestInterceptor) {
      this.http.interceptors.request.use(
        this.requestInterceptor.resolve,
        this.requestInterceptor.reject
      );
    }
    if (this.responseInterceptor) {
      this.http.interceptors.request.use(
        this.responseInterceptor.resolve,
        this.responseInterceptor.reject
      );
    }
  }

  /**
   * Perform the backend request to search and return the serialized list of results for the app state `results`.
   * @param {string} stateQuery the `query` state with the user input
   */
  search = async stateQuery => {
    const payload = this.requestSerializer.serialize(stateQuery);
    const response = await this.http.request({
      method: 'POST',
      data: payload,
    });
    return this.responseSerializer.serialize(response.data);
  };
}
