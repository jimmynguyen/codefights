function res = isGeometricProgression(sequence)
	res = all(diff(sequence(2:end)./sequence(1:end-1)) == 0);
endfunction
%!assert(isGeometricProgression([1, 4, 16]), true)
%!assert(isGeometricProgression([2, 4, 8, 17, 34]), false)
%!assert(isGeometricProgression([27, 9, 3, 1]), true)
%!assert(isGeometricProgression([4, 6, 9]), true)
%!assert(isGeometricProgression([18, 9, 3, 1]), false)
%!assert(isGeometricProgression([25, 10, 4]), true)
%!assert(isGeometricProgression([1, 3, 9, 27]), true)
%!assert(isGeometricProgression([1, 3, 9, 27, 81, 243]), true)
%!assert(isGeometricProgression([1, 3, 9, 27, 81, 244]), false)
%!assert(isGeometricProgression([10, 100, 1000]), true)
%!assert(isGeometricProgression([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), false)
%!assert(isGeometricProgression([2, 4, 8, 16]), true)