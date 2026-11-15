import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';

export function useFetch(path) {
  const [state, setState] = useState({
    loading: true,
    error: '',
    data: null
  });

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    return api.get(path)
      .then((response) => {
        setState({ loading: false, error: '', data: response.data.data });
        return response.data.data;
      })
      .catch((error) => {
        setState({
          loading: false,
          error: getErrorMessage(error, 'Unable to load this page.'),
          data: null
        });
        return null;
      });
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
