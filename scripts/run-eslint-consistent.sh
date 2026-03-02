#!/usr/bin/env bash

set -euo pipefail

tmp_backup=""

restore_generated_frontend_dirs() {
    if [ -z "${tmp_backup}" ] || [ ! -d "${tmp_backup}" ]; then
        return
    fi

    for dir in actions routes wayfinder; do
        if [ -d "${tmp_backup}/${dir}" ]; then
            mv "${tmp_backup}/${dir}" "resources/js/${dir}"
        fi
    done

    rmdir "${tmp_backup}"
}

tmp_backup=$(mktemp -d /tmp/poofmq-eslint-XXXXXX)
trap restore_generated_frontend_dirs EXIT

for dir in resources/js/actions resources/js/routes resources/js/wayfinder; do
    if [ -d "${dir}" ] && git check-ignore -q "${dir}"; then
        mv "${dir}" "${tmp_backup}/$(basename "${dir}")"
    fi
done

eslint . "$@"
