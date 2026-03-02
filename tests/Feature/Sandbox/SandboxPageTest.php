<?php

use function Pest\Laravel\get;

test('sandbox page can be viewed without authentication', function () {
    get(route('sandbox.index'))
        ->assertOk();
});
